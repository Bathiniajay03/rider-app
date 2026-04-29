import AsyncStorage from '@react-native-async-storage/async-storage';

class SignalRService {
  connection = null;

  async initializeConnection() {
    const hubUrl = process.env.EXPO_PUBLIC_SIGNALR_URL || 'https://intermetameric-codi-unexasperating.ngrok-free.dev/deliveryhub';
    if (!hubUrl) {
      return;
    }

    try {
      const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');
      const token = await AsyncStorage.getItem('rider_token');

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      this.connection.on('ReceiveOrderUpdate', (orderUpdate) => {
        if (this.onOrderUpdate) {
          this.onOrderUpdate(orderUpdate);
        }
      });

      await this.connection.start();
    } catch (err) {
      console.log('SignalR disabled or unavailable:', err.message);
      this.connection = null;
    }
  }

  async sendLocation(riderId, latitude, longitude) {
    if (this.connection && this.connection.state === 'Connected') {
      await this.connection.invoke('SendLocation', riderId, latitude, longitude);
    }
  }

  on(event, callback) {
    if (event === 'orderUpdate') {
      this.onOrderUpdate = callback;
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }
}

export default new SignalRService();
