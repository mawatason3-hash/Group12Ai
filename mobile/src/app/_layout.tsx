import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B5E20' },
        headerTintColor: '#FFFFFF',
        contentStyle: { backgroundColor: '#E8F5E9' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'AgriSoko Pocket GXX' }} />
      <Stack.Screen name="ask" options={{ title: 'Ask the Team' }} />
    </Stack>
  );
}
