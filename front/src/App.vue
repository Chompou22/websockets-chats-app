<script setup>
import { io } from "socket.io-client";
import { onBeforeMount, ref } from "vue";

const socket = io("http://localhost:5000");
const messages = ref([]);
const messageText = ref("");
const joined = ref(false);
const name = ref("");
const typingDisplay = ref("");

onBeforeMount(() => {
  socket.emit("findAllMessages", {}, (response) => {
    messages.value = response;
  });

  socket.on("newMessage", (message) => {
    messages.value.push(message);
  });

  socket.on("typing", ({ name, isTyping }) => {
    if (isTyping) {
      typingDisplay.value = `${name} is typing...`;
    } else {
      typingDisplay.value = "";
    }
  });
});

// to identify the user who joined the group
const join = () => {
  socket.emit("join", { name: name.value }, () => {
    joined.value = true;
  });
};

// allow the each client to send a new message by there own.
const sendMessage = () => {
  socket.emit("createMessage", { text: messageText.value }, () => {
    messageText.value = "";
  });
};

// tracking the user typing
let timeout;
const emitTyping = () => {
  socket.emit("typing", { isTyping: true }, () => {
    timeout = setTimeout(() => {
      socket.emit("typing", { isTyping: false });
    }, 2000);
  });
};
</script>

<template>
  <div class="chat">
    <div v-if="!joined">
      <form @submit.prevent="join">
        <label for="name"
          >Enter your name to get your identify when your joined the group
          server :
        </label>
        <input v-model="name" type="text" />
        <button type="submit">Join</button>
      </form>
    </div>
    <div class="chat-container">
      <div class="messages-container">
        <div v-for="message in messages">
          [{{ message.name }}] : {{ message.text }}
        </div>
      </div>
    </div>
    <div v-if="typingDisplay">{{ typingDisplay }}</div>
    <div class="message-input">
      <form @submit.prevent="sendMessage">
        <label>Message :</label>
        <input v-model="messageText" type="text" @input="emitTyping" />
        <button type="submit">Send</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.chat {
  padding: 20px;
  height: 100vh;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
}
</style>
