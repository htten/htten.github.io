# HEARTBEAT.md

# Agent 自动协作

## 核心机制
main 作为协调者，用 sessions_send 调用其他 agent

## 触发方式
当用户说"讨论"、"让XX和YY对话"时，自动执行

## 讨论流程
1. 解析主题和参与 agents
2. 并发发送给所有参与 agent
3. 收集回复后整合返回

## 示例
| 输入 | 行为 |
|------|------|
| "让 coding-agent 查一下 XXX" | 只调用 coding-agent |
| "让 coding-agent 和 research-agent 讨论 AI" | 调用两个 agent，整合观点 |

## 配置
- 超时：60s/agent
- 并发发送，同时等待
