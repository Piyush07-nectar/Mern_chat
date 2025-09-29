const Chat = require('../../models/chatmodel');     
const User = require('../../models/usermodel');
const accessChats = async (req, res) => {
    try {
        const { userId } = req.body;
        if(!userId){
            return res.status(400).json({ message: "UserId not found" });
        }

        // Security Check: Verify the target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Security Check: Prevent users from chatting with themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot create chat with yourself" });
        }

        // Check if chat already exists
        var isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } }
            ],
        }).populate("users","-password").populate("latestMessage");
        
        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name pic email",
        });

        if(isChat.length > 0){
            // Security Check: Verify the user is still part of this chat
            const chat = isChat[0];
            const isUserInChat = chat.users.some(user => user._id.toString() === req.user._id.toString());
            if (!isUserInChat) {
                return res.status(403).json({ message: "Access denied to this chat" });
            }
            return res.send(chat);
        }
        else{
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId]
            };
            
            var newChat = await Chat.create(chatData);
            var fullChat = await Chat.findOne({_id: newChat._id}).populate("users","-password");
            return res.send(fullChat);
        }
    }
    catch(error){
        res.status(400);
        throw new Error(error.message);
    } 
};
const getAllChats = async (req, res) => {
  try{
    // Security Check: Only get chats where the current user is a member
    var chats = await Chat.find({users:{$in:[req.user._id]}})
      .populate("users","-password")
      .populate("latestMessage","-createdAt")
      .populate("groupAdmin","-password")
      .sort({updatedAt:-1})
      .populate("latestMessage.sender","name pic email");  
    
    // Additional security: Filter out any chats that don't include the current user
    chats = chats.filter(chat => 
      chat.users.some(user => user._id.toString() === req.user._id.toString())
    );
    
    chats = await User.populate(chats, {
      path: "users",
      select: "name pic email",
    });
    
    console.log(`User ${req.user._id} accessed ${chats.length} chats`);
    res.send(chats);
  }
  catch(error){
    res.status(400);
    throw new Error(error.message);
  }
}
const createGroupChat = async (req, res) => {
  try {
    const { users, name } = req.body;
    if(!users || !name){
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    
    var user;
    try {
      // Parse the JSON string if it's a string, otherwise use as is
      user = typeof users === 'string' ? JSON.parse(users) : users;
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid users format" });
    }
    
    if(!Array.isArray(user) || user.length < 2){
      return res.status(400).json({ message: "Please add at least 2 users" });
    } 
    
    // Add current user to the group
    user.push(req.user._id);
    
    var groupChat = await Chat.create({
      users: user,
      chatName: name,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });
    
    const fullGroupChat = await Chat.findOne({_id: groupChat._id})
      .populate("users","-password")
      .populate("groupAdmin","-password");
    
    return res.send(fullGroupChat);
  }
  catch(error){
    console.error('Error creating group chat:', error);
    res.status(400);
    throw new Error(error.message);
  }
}
const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    if(!chatId || !chatName){
      return res.status(400).json({ message: "ChatId and chatName are required" });
    }
    
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName: chatName }, { new: true })
      .populate("users","-password")
      .populate("groupAdmin","-password");
    
    if(!updatedChat){
      return res.status(404).json({ message: "Chat not found" });
    }
    
    return res.send(updatedChat);
  }
  catch(error){
    res.status(400);
    throw new Error(error.message);
  }
}
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    if(!chatId || !userId){
      return res.status(400).json({ message: "ChatId and userId are required" });
    }
    
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { $pull: { users: userId } }, { new: true })
      .populate("users","-password")
      .populate("groupAdmin","-password");
    
    if(!updatedChat){
      return res.status(404).json({ message: "Chat not found" });
    }
    
    return res.send(updatedChat);
  }
  catch(error){
    res.status(400);
    throw new Error(error.message);
  }
}
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    if(!chatId || !userId){
      return res.status(400).json({ message: "ChatId and userId are required" });
    }
    
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { $push: { users: userId } }, { new: true })
      .populate("users","-password")
      .populate("groupAdmin","-password");
    
    if(!updatedChat){
      return res.status(404).json({ message: "Chat not found" });
    }
    
    return res.send(updatedChat);
  }
  catch(error){
    res.status(400);
    throw new Error(error.message);
  }
}
module.exports = { accessChats, getAllChats, createGroupChat, renameGroup, removeFromGroup, addToGroup };