#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      india_post::search_by_pincode,
      india_post::search_by_postoffice_name
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

mod india_post {
  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
  #[serde(rename_all = "PascalCase")]
  pub struct PostOffice {
    pub name: String,
    pub description: Option<String>,
    pub branch_type: Option<String>,
    pub delivery_status: Option<String>,
    pub circle: Option<String>,
    pub district: Option<String>,
    pub division: Option<String>,
    pub region: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub pincode: Option<String>,
  }

  #[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
  #[serde(rename_all = "PascalCase")]
  pub struct IndiaPostResponse {
    pub message: String,
    pub status: String,
    pub post_office: Option<Vec<PostOffice>>,
  }

  async fn fetch_india_post(url: &str) -> Result<IndiaPostResponse, String> {
    let client = reqwest::Client::new();
    let mut list: Vec<IndiaPostResponse> = client
      .get(url)
      .header(reqwest::header::ACCEPT, "application/json")
      .send()
      .await
      .map_err(|e| format!("Network error: {e}"))?
      .json()
      .await
      .map_err(|e| format!("Invalid response from API: {e}"))?;

    let first = list
      .pop()
      .ok_or_else(|| "Empty response from API".to_string())?;

    if first.status.to_ascii_lowercase() != "success" {
      return Err(first.message.clone());
    }

    Ok(first)
  }

  #[tauri::command]
  pub async fn search_by_pincode(pincode: String) -> Result<IndiaPostResponse, String> {
    let pincode = pincode.trim();
    if pincode.is_empty() {
      return Err("Please enter a pincode.".to_string());
    }
    if !pincode.chars().all(|c| c.is_ascii_digit()) || pincode.len() != 6 {
      return Err("Pincode must be exactly 6 digits.".to_string());
    }

    fetch_india_post(&format!(
      "https://api.postalpincode.in/pincode/{}",
      pincode
    ))
    .await
  }

  #[tauri::command]
  pub async fn search_by_postoffice_name(name: String) -> Result<IndiaPostResponse, String> {
    let name = name.trim();
    if name.is_empty() {
      return Err("Please enter a post office name.".to_string());
    }

    fetch_india_post(&format!(
      "https://api.postalpincode.in/postoffice/{}",
      urlencoding::encode(name)
    ))
    .await
  }
}
