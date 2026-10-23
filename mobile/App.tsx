import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AskResult } from "./services/api";
import { colors } from "./theme";
import AskScreen from "./screens/AskScreen";
import DirectoryScreen from "./screens/DirectoryScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ResultScreen from "./screens/ResultScreen";

export type RootStackParamList = {
  Home: undefined;
  Ask: undefined;
  Result: { result: AskResult };
  Directory: undefined;
  Profile: { memberId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "AgriSoko Pocket" }} />
        <Stack.Screen name="Ask" component={AskScreen} options={{ title: "Ask the Team" }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Your Match" }} />
        <Stack.Screen name="Directory" component={DirectoryScreen} options={{ title: "Member Directory" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Member Profile" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
