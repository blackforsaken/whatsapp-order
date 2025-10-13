
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      title: 'Pedidos',
      icon: 'cart.fill',
      route: '/(tabs)/(home)',
    },
    {
      name: 'profile',
      title: 'Perfil',
      icon: 'person.fill',
      route: '/(tabs)/profile',
    },
  ];

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Screen
          name="(home)"
          options={{
            tabBarIcon: ({ color }) => <Icon name="cart.fill" color={color} />,
            tabBarLabel: ({ color }) => <Label color={color}>Pedidos</Label>,
          }}
        />
        <NativeTabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => <Icon name="person.fill" color={color} />,
            tabBarLabel: ({ color }) => <Label color={color}>Perfil</Label>,
          }}
        />
      </NativeTabs>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
