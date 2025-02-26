// 首先，让我们修改sidepanel.tsx中的代码，添加元素选择功能

import "./style.css"

import { MousePointer, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Separator } from "./components/ui/separator"
import { Toggle } from "./components/ui/toggle" // 你可能需要添加这个组件

interface Message {
  role: "user" | "assistant"
  content: string
}

function IndexSidePanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSelectMode, setIsSelectMode] = useState(false)

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

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: "user", content: input }])
    setInput("")
    // Here you would typically call your API
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
