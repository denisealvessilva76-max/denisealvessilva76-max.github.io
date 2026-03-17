import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 1,
        },
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol size={23} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ergonomia"
        options={{
          title: "Ergonomia",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol size={23} name="chevron.left.forwardslash.chevron.right" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saude"
        options={{
          title: "Saúde",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol size={23} name="heart.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="comunicados"
        options={{
          title: "Avisos",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol size={23} name="bell.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary + "22" }]}>
              <IconSymbol size={23} name="person.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
