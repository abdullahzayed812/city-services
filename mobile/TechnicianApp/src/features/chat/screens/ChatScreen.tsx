import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {io, Socket} from 'socket.io-client';
import {apiClient} from '@api/client';
import {useAuthStore} from '@store/auth.store';
import {getServerBaseUrl} from '@store/server.store';
import {ar} from '@i18n/ar';
import dayjs from 'dayjs';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

interface Message {
  id: number;
  sender_id: number;
  content: string;
  message_type: string;
  created_at: string;
}

export default function ChatScreen({route}: Props) {
  const {requestId, customerName} = route.params as {requestId: number; customerName: string};
  const {accessToken, user} = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList>(null);

  const {isLoading} = useQuery({
    queryKey: ['chat', requestId],
    queryFn: async () => {
      const res = await apiClient.get(`/chats/${requestId}`);
      const chat = res.data.data;
      setMessages(chat.messages ?? []);
      return chat;
    },
  });

  useEffect(() => {
    const socket = io(getServerBaseUrl(), {auth: {token: accessToken}});
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:join', {requestId});
    });

    socket.on('chat:message_received', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      listRef.current?.scrollToEnd({animated: true});
    });

    return () => {socket.disconnect();};
  }, [accessToken, requestId]);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socketRef.current?.emit('chat:send_message', {requestId, content: message.trim(), messageType: 'text'});
    setMessage('');
  }, [message, requestId]);

  const renderMessage = ({item}: {item: Message}) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMine && {color: '#fff'}]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMine && {color: 'rgba(255,255,255,0.7)'}]}>
            {dayjs(item.created_at).format('HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
      />
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={ar.chat.typeMessage}
          textAlign="right"
          multiline
          maxLength={500}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0f0f5'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  list: {padding: 16, paddingBottom: 8},
  msgWrapper: {marginBottom: 8},
  myMsgWrapper: {alignItems: 'flex-start'},
  theirMsgWrapper: {alignItems: 'flex-end'},
  bubble: {maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10},
  myBubble: {backgroundColor: '#1a237e', borderBottomLeftRadius: 4},
  theirBubble: {backgroundColor: '#fff', borderBottomRightRadius: 4, elevation: 1},
  msgText: {fontSize: 14, color: '#333', fontFamily: 'Cairo-Regular'},
  msgTime: {fontSize: 10, color: '#888', marginTop: 4},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#fafafa',
    fontFamily: 'Cairo-Regular',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {color: '#fff', fontSize: 18},
});
