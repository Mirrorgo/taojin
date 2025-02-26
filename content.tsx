// content.ts 或 content.tsx
// 这个文件应该在你的项目根目录下，作为 Plasmo 的内容脚本入口点

import type { PlasmoCSConfig } from "plasmo"

// 限制内容脚本仅在文档加载完成后运行
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

// 当前状态
let isSelectModeEnabled = false
let highlightedElement: HTMLElement | null = null
let overlayElement: HTMLElement | null = null

// 创建悬浮元素的样式
const createOverlayStyles = () => {
  const style = document.createElement("style")
  style.id = "plasmo-element-selector-style"
  style.textContent = `
    .plasmo-element-highlight {
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      border: 2px solid #3b82f6 !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      transition: all 0.1s ease-out;
      box-sizing: border-box;
    }
  `
  document.head.appendChild(style)
}

// 创建悬浮元素
const createOverlayElement = () => {
  if (!overlayElement) {
    overlayElement = document.createElement("div")
    overlayElement.classList.add("plasmo-element-highlight")
    document.body.appendChild(overlayElement)
  }
}

// 更新悬浮元素位置
const updateOverlayPosition = (element: HTMLElement) => {
  if (!overlayElement) return

  const rect = element.getBoundingClientRect()
  overlayElement.style.top = `${rect.top}px`
  overlayElement.style.left = `${rect.left}px`
  overlayElement.style.width = `${rect.width}px`
  overlayElement.style.height = `${rect.height}px`
}

// 移除悬浮元素
const removeOverlay = () => {
  if (overlayElement && overlayElement.parentNode) {
    overlayElement.parentNode.removeChild(overlayElement)
    overlayElement = null
  }
}

// 鼠标移动事件处理
const handleMouseMove = (e: MouseEvent) => {
  if (!isSelectModeEnabled) return

  // 忽略 plasmo 的侧边栏元素
  if ((e.target as HTMLElement).closest("[data-plasmo-cs]")) return

  // 获取当前元素
  const element = e.target as HTMLElement

  // 如果元素改变，更新悬浮元素
  if (element !== highlightedElement) {
    highlightedElement = element
    updateOverlayPosition(element)
  }
}

// 鼠标点击事件处理
const handleMouseClick = (e: MouseEvent) => {
  if (!isSelectModeEnabled) return

  // 防止默认行为和冒泡
  e.preventDefault()
  e.stopPropagation()

  // 忽略 plasmo 的侧边栏元素
  if ((e.target as HTMLElement).closest("[data-plasmo-cs]")) return

  const element = e.target as HTMLElement
  const tagName = element.tagName.toLowerCase()
  const classes = element.className

  // 获取额外的元素信息
  const elementInfo = {
    tagName,
    classes,
    id: element.id,
    textContent: element.textContent || "",
    attributes: Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value
    }))
  }

  // 发送消息到侧边栏
  chrome.runtime.sendMessage({
    action: "elementSelected",
    ...elementInfo
  })

  // 禁用选择模式
  disableSelectMode()
}

// 启用选择模式
const enableSelectMode = () => {
  if (isSelectModeEnabled) return

  isSelectModeEnabled = true
  createOverlayStyles()
  createOverlayElement()

  // 添加事件监听器
  document.addEventListener("mousemove", handleMouseMove, true)
  document.addEventListener("click", handleMouseClick, true)

  // 改变光标为指针样式
  document.body.style.cursor = "crosshair"
}

// 禁用选择模式
const disableSelectMode = () => {
  if (!isSelectModeEnabled) return

  isSelectModeEnabled = false

  // 移除事件监听器
  document.removeEventListener("mousemove", handleMouseMove, true)
  document.removeEventListener("click", handleMouseClick, true)

  // 恢复光标
  document.body.style.cursor = ""

  // 移除悬浮元素
  removeOverlay()
  highlightedElement = null

  // 移除样式
  const style = document.getElementById("plasmo-element-selector-style")
  if (style && style.parentNode) {
    style.parentNode.removeChild(style)
  }
}

// 测试是否加载
console.log("Content script loaded!")

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "enableSelectMode") {
    enableSelectMode()
  } else if (message.action === "disableSelectMode") {
    disableSelectMode()
  }
})

// 页面卸载时清理
window.addEventListener("unload", () => {
  disableSelectMode()
})

// 内容脚本的主函数
function PlasmoElementSelector() {
  // 这个函数是必需的，但是所有的逻辑都在上面的事件处理中
  return null
}

export default PlasmoElementSelector
