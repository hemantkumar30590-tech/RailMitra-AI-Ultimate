async function test() {
  try {
    const text = "यात्री कृपया ध्यान दें";
    const res = await fetch(`https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=hi-IN&q=${encodeURIComponent(text)}`);
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
  } catch (err) {
    console.error(err);
  }
}
test();
