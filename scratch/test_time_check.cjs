function checkTradingHours() {
  const options = { timeZone: "Asia/Taipei", hour12: false };
  const dateStr = new Date().toLocaleString("zh-TW", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }); // "2026/05/28"
  const timeStr = new Date().toLocaleString("zh-TW", { ...options, hour: "2-digit", minute: "2-digit" }); // "00:26"
  
  const taipeiDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const taipeiDay = taipeiDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekday = taipeiDay >= 1 && taipeiDay <= 5;
  const isTradingHours = isWeekday && (timeStr >= "09:00" && timeStr <= "13:30");

  console.log('Taipei Date String:', dateStr);
  console.log('Taipei Time String:', timeStr);
  console.log('Taipei Day of Week (0-6):', taipeiDay);
  console.log('Is Weekday?', isWeekday);
  console.log('Is Trading Hours?', isTradingHours);
}

checkTradingHours();
