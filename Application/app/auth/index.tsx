import { View, Text } from 'react-native';

export default function AuthScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Authentication</Text>
      <Text style={{ marginTop: 8 }}>Sign in or sign up to continue.</Text>
    </View>
  );
}