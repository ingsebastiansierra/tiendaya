import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#10B981',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 60,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
                }}
            />
            <Tabs.Screen
                name="ventas"
                options={{
                    title: 'Ventas',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
                }}
            />
            <Tabs.Screen
                name="inventario"
                options={{
                    title: 'Inventario',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📦</Text>,
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
                }}
            />
        </Tabs>
    );
}
