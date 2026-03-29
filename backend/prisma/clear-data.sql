-- 临时关闭外键约束，避免关联表删除报错
PRAGMA foreign_keys = OFF;

-- 按依赖顺序清空表（先删子表，再删主表）
DELETE FROM Message;
DELETE FROM Conversation;
DELETE FROM User;

-- 重置自增ID，让新插入的数据ID从1重新开始
DELETE FROM sqlite_sequence WHERE name='Message';
DELETE FROM sqlite_sequence WHERE name='Conversation';
DELETE FROM sqlite_sequence WHERE name='User';

-- 重新开启外键约束
PRAGMA foreign_keys = ON;