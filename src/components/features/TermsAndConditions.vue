<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-container">
      <div class="terms-container">
        <h1>Terms and Conditions</h1>
        <p>
          Welcome to Chatter! This application is currently under development, and we are thrilled to have you explore its features. However, we must emphasize that, as this is a work in progress, there are certain important considerations you should be aware of before using our platform.
        </p>
        <p>
          **1. No Personal Information:** We strongly advise against using or sharing any personal information or data on this platform at this stage. As a developing application, Chatter has not yet implemented full data protection measures, and any personal data you provide could be at risk. This includes but is not limited to your real name, email address, phone number, home address, or any other sensitive information.
        </p>
        <p>
          **2. Data Security:** We are actively working on enhancing the security features of Chatter to ensure that your data is protected. However, until the platform is fully secured, we cannot guarantee the safety of any data you input or share. Please refrain from sharing confidential or personal data.
        </p>
        <p>
          **3. User Content:** Content you create and share on Chatter during this development phase may be visible to other users and could be used for testing purposes by our development team. We may monitor, review, and use your contributions to improve the platform. Please ensure that any content you share is non-sensitive and that you are comfortable with it potentially being used for these purposes.
        </p>
        <p>
          **4. No Permanent Storage:** As the platform is in development, there may be instances where user data, posts, or other content may not be permanently stored. There is a possibility that data may be lost or deleted as part of testing or updates. We recommend not relying on Chatter for the storage of important information during this phase.
        </p>
        <p>
          **5. Feedback and Suggestions:** We welcome your feedback and suggestions as we continue to develop Chatter. Your input is invaluable to us, and we encourage you to share your thoughts. However, please be aware that any feedback you provide may be used by our team without obligation or compensation.
        </p>
        <p>
          **6. Acceptance of Terms:** By using Chatter, you acknowledge that you understand and agree to these terms and conditions. If you do not agree with these terms, we advise you not to use the platform until it is fully launched and secure.
        </p>
        <p>
          We appreciate your understanding and cooperation as we work towards making Chatter a fully functional and secure platform. Your participation during this development phase is crucial, and we look forward to delivering an excellent user experience in the near future. Thank you for being part of our journey!
        </p>
        <button class="close-button" @click="closeModal">Close</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TermsModal',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeModal = () => {
      emit('close');
    };

    return {
      closeModal
    };
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 100%;
  overflow: scroll;
  height: 400px;
}

.terms-container h1 {
  font-size: 28px;
  color: var(--orange);
  margin-bottom: 20px;
  text-align: center;
}

.terms-container p {
  line-height: 1.6;
  font-size: 16px;
  color: var(--muted);
  margin-bottom: 15px;
}

.close-button {
  display: block;
  margin: 20px auto 0;
  padding: 10px 20px;
  background-color: var(--orange);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
}

.close-button:hover {
  background-color: var(--orange-2);
}

@media (max-width: 768px) {
  .modal-container {
    padding: 15px;
  }

  .terms-container h1 {
    font-size: 24px;
  }

  .terms-container p {
    font-size: 14px;
  }

  .close-button {
    font-size: 14px;
  }
}
</style>
