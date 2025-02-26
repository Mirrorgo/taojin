export {}

// 之后改两种方式，且支持切换，一个是inject，一个side panel
chrome.sidePanel.setPanelBehavior({
  openPanelOnActionClick: true
})

// // 监听命令
// chrome.commands.onCommand.addListener((command) => {
//   if (command === "toggle-sidebar") {
//     // 检查当前侧边栏状态
//     chrome.sidePanel.getOptions({}, (options) => {
//       const isOpen = options.enabled || false

//       // 切换侧边栏状态
//       chrome.sidePanel.setOptions({
//         enabled: !isOpen
//       })
//     })
//   }
// })
