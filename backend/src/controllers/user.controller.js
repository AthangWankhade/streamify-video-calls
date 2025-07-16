import FriendsRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendation controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    //Prevent sending req to yourself
    if (myId === recipientId)
      return res
        .status(400)
        .json({ message: "You can't send friends request to yourself" });

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ message: "recipient not found" });
    }

    //Check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(404).json({ message: "YOu are already friends" });
    }

    //check if req already exists
    const existingRequest = await FriendsRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "A Friends request already exists between you and this user",
      });
    }

    const friendRequest = await FriendsRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendsRequest controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendsRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friends request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "YOu are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friends request Accepted" });
  } catch (error) {
    console.error("Error in acceptFriendsRequest controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendsRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );

    const acceptedReqs = await FriendsRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("sender", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("ERROR in getPendingFriendsRequest controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendsRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullname profilePic nativeLanguage learningLanguage"
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendsReqs controller", error.message);
    res.status(500).json({ message: "Internal server Error" });
  }
}
