import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors, typography } from "@/theme";

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 22,
        opacity: focused ? 1 : 0.55,
        transform: [{ scale: focused ? 1.05 : 1 }],
      }}
    >
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bgElev,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cards",
          tabBarIcon: ({ focused }) => <TabIcon glyph="💳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: "Restaurants",
          tabBarIcon: ({ focused }) => <TabIcon glyph="🍽️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-wallet"
        options={{
          title: "My Wallet",
          tabBarIcon: ({ focused }) => <TabIcon glyph="💼" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Build Wallet",
          tabBarIcon: ({ focused }) => <TabIcon glyph="🧩" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
