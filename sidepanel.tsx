// 首先，让我们修改sidepanel.tsx中的代码，添加元素选择功能

import "./style.css"

import { MousePointer, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Separator } from "./components/ui/separator"
import { Toggle } from "./components/ui/toggle" // 你可能需要添加这个组件

// 导入 AI 服务
import { callAI } from "./utils/aiService"

interface Message {
  role: "user" | "assistant"
  content: string
}

function IndexSidePanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSelectMode, setIsSelectMode] = useState(false)
  // 从环境变量读取API密钥
  const apiKey = process.env.PLASMO_PUBLIC_AI_API_KEY || ""

  const clearMessages = () => {
    setMessages([])
  }

  // 启用或禁用选择模式
  const toggleSelectMode = () => {
    const newMode = !isSelectMode
    setIsSelectMode(newMode)

    // 通过消息传递与内容脚本通信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: newMode ? "enableSelectMode" : "disableSelectMode"
        })
      }
    })
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 监听来自内容脚本的消息
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === "elementSelected") {
        // 元素被选中时，添加到消息列表
        setMessages([
          ...messages,
          {
            role: "user",
            // content: `Selected: ${message.tagName} (${message.classes}) content:${message.textContent}`
            content: `${message.textContent}`
          }
        ])

        // 自动关闭选择模式
        setIsSelectMode(false)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    // 清理函数
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 通用的发送消息并获取AI响应的函数
  const sendMessageToAI = (messageContent: string) => {
    if (!messageContent.trim()) return

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: messageContent }
    ]

    // 先更新UI显示用户消息
    setMessages(updatedMessages)

    // 调用AI服务并处理响应
    callAI(updatedMessages, "qwen", {
      apiKey: apiKey,
      modelName: "qwen-turbo-2024-11-01"
    })
      .then((response) => {
        if (response.success) {
          // 将AI响应添加到包含新消息的更新数组
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: response.content }
          ])
        } else {
          // 处理错误情况
          setMessages([
            ...updatedMessages,
            {
              role: "assistant",
              content: `错误: ${response.error || "未知错误"}`
            }
          ])
        }
      })
      .catch((error) => {
        // 处理网络错误等异常
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: `错误: ${error.message || "无法与AI服务通信"}`
          }
        ])
      })
  }

  // 获取最新的用户消息
  const getLastUserMessage = (): string => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user")
    return lastUserMessage ? lastUserMessage.content : ""
  }

  // 处理发送按钮点击
  const handleSend = () => {
    if (!input.trim()) return
    sendMessageToAI(input)
    setInput("") // 清空输入框
  }

  // 处理翻译按钮点击
  const handleTranslate = () => {
    const lastContent = getLastUserMessage()
    if (!lastContent) return

    const translationRequest = `请将以下文本翻译成中文：\n\n${lastContent}`
    sendMessageToAI(translationRequest)
  }

  // 处理解释按钮点击
  const handleExplain = () => {
    const lastContent = getLastUserMessage()
    if (!lastContent) return

    const explainRequest = `请解释以下内容，用简单易懂的语言：\n\n${lastContent}`
    sendMessageToAI(explainRequest)
  }

  return (
    <div className="flex flex-col h-screen p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Toggle
          aria-label="Toggle element selection mode"
          pressed={isSelectMode}
          onPressedChange={toggleSelectMode}>
          <MousePointer
            className={`h-4 w-4 ${isSelectMode ? "text-primary" : ""}`}
          />
        </Toggle>
        <div className="text-sm text-muted-foreground">
          {isSelectMode
            ? "Click on an element to select it"
            : "Element Selector"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Separator className="my-2" />
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Add this div at the end */}
        </div>
      </ScrollArea>

      {/* <div className="flex space-x-2">
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => handleTranslate()}>
          翻译一下
        </Button>
        <Button
          className="px-4 py-2 text-sm rounded-md bg-green-500 hover:bg-green-600 text-white"
          onClick={() => handleExplain()}>
          解释一下
        </Button>
      </div> */}

      <div className="flex gap-2 pt-4">
        <Input
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
}

export default IndexSidePanel
