// ──────────────────────────────────────────────────
//  우리끼리 찰칵 — POST 수신 Apps Script
//  배포: 확장 프로그램 > Apps Script > 웹 앱으로 배포
//  실행 계정: 나 / 액세스: 모든 사용자(익명 포함)
// ──────────────────────────────────────────────────

// 데이터를 기록할 스프레드시트 ID
// (URL에서 /d/XXXX/edit 부분의 XXXX)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME     = '찰칵_기록';

// ── POST 수신 ──────────────────────────────────────
function doPost(e) {
  try {
    // no-cors 환경에서는 Content-Type이 text/plain으로 오므로
    // postData.contents 또는 postData.getDataAsString() 으로 파싱
    const raw  = (e.postData && (e.postData.contents || e.postData.getDataAsString())) || '';
    if (!raw) return jsonResponse(400, 'No body');

    const data = JSON.parse(raw);
    const phone     = data.phone     || '';
    const company   = data.company   || '';
    const timestamp = data.timestamp || new Date().toISOString();

    appendRow(phone, company, timestamp);

    return jsonResponse(200, 'OK', { phone, company, timestamp });

  } catch (err) {
    return jsonResponse(500, err.message);
  }
}

// GET — 간단한 헬스체크
function doGet() {
  return jsonResponse(200, 'takePic receiver is running');
}

// ── 스프레드시트에 행 추가 ─────────────────────────
function appendRow(phone, company, timestamp) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  // 시트가 없으면 생성 + 헤더
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['수신일시', '전화번호', '소속회사', '원본타임스탬프']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:D1')
         .setBackground('#1a1a2e')
         .setFontColor('#a78bfa')
         .setFontWeight('bold');
  }

  const kstTime = toKST(timestamp);
  sheet.appendRow([kstTime, phone, company, timestamp]);
}

// ── ISO timestamp → KST 문자열 ─────────────────────
function toKST(isoStr) {
  try {
    const d = new Date(isoStr);
    return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  } catch (_) {
    return isoStr;
  }
}

// ── JSON 응답 헬퍼 ─────────────────────────────────
function jsonResponse(status, message, extra) {
  const body = Object.assign({ status, message }, extra || {});
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
