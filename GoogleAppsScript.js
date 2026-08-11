/**
 * ==============================================================================
 * MERVE & EMRULLAH DÜĞÜN ANILARI — GOOGLE DRIVE & SHEETS ENTEGRASYON KODU
 * ==============================================================================
 * Bu kod Google Apps Script (script.google.com) üzerinde çalışır.
 * Konukların siteden yüklediği tüm fotoğraf, video ve ses kayıtlarını Google Drive'ınıza,
 * yazılı anı ve dilek mesajlarını ise Google Sheets (Excel) tablonuza otomatik kaydeder.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // 1. Google Drive Ana Klasörünü Bul veya Oluştur
    var folderName = "Merve & Emrullah Düğün Anıları";
    var folders = DriveApp.getFoldersByName(folderName);
    var mainFolder;
    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder(folderName);
    }

    // 2. Google Sheets (Excel) Anı Defterini Bul veya Oluştur
    var sheetName = "Düğün Anı Defteri & Dilekler";
    var files = mainFolder.getFilesByName(sheetName);
    var spreadsheet;
    var sheet;

    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
      sheet = spreadsheet.getActiveSheet();
    } else {
      spreadsheet = SpreadsheetApp.create(sheetName);
      var sheetFile = DriveApp.getFileById(spreadsheet.getId());
      sheetFile.moveTo(mainFolder);
      sheet = spreadsheet.getActiveSheet();
      // Başlık Satırı Oluştur
      sheet.appendRow([
        "Tarih & Saat", 
        "Ad Soyad", 
        "Yakınlık Derecesi", 
        "Anı Türü", 
        "Hissiyat / Mood", 
        "Anı Mesajı / Notu", 
        "Google Drive Dosya Bağlantısı"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#FFFFFF");
    }

    var driveFileUrl = "";

    // 3. Eğer Medya Dosyası (Fotoğraf/Video/Ses) Varsa Drive'a Kaydet
    if (data.mediaUrl && data.mediaUrl.startsWith("data:")) {
      var parts = data.mediaUrl.split(",");
      var contentType = parts[0].split(";")[0].replace("data:", "");
      var base64Data = parts[1];
      var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
      
      var ext = "png";
      if (contentType.indexOf("image/jpeg") !== -1) ext = "jpg";
      else if (contentType.indexOf("video") !== -1) ext = "mp4";
      else if (contentType.indexOf("audio") !== -1) ext = "webm";

      var fileName = (data.name || "Davetli") + "_" + data.type + "_" + Date.now() + "." + ext;
      decodedBlob.setName(fileName);
      
      var file = mainFolder.createFile(decodedBlob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileUrl = file.getUrl();
    }

    // 4. Bilgileri Google Sheets Tablosuna Ekle
    var timeStr = Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss");
    sheet.appendRow([
      timeStr,
      data.name || "İsimsiz Davetli",
      data.side || "Ortak Arkadaş",
      data.type || "wish",
      data.mood || "✨ Anı",
      data.message || "",
      driveFileUrl || "Yalnızca Yazılı Mesaj"
    ]);

    // Başarılı Yanıt Döndür
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Anı Google Drive & Sheets'e başarıyla kaydedildi!",
      driveFileUrl: driveFileUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Merve & Emrullah Düğün Google Drive Webhook Aktif!");
}
