import { ConversationItem } from "./ConversationItem";
import { Conversation } from "@/store/types";
interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}
export function ConversationList({
  conversations,
  onSelectConversation,
  onDeleteConversation,
}: ConversationListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-4">
      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-4">
          暂无历史会话
        </p>
      ) : (
        // ✅ 2. 补一个简单的 div 作为外层包裹元素
        <div>
          {conversations.map((conv: Conversation) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={onDeleteConversation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
