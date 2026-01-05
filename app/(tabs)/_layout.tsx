import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

function FloatingButton() {
    const router = useRouter();

    return (
        <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => router.push('/(tabs)/ventas')}
            >
                <Text style={styles.floatingButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <>
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
                        backgroundColor: '#fff',
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
                    name="mesas"
                    options={{
                        title: 'Mesas',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🍺</Text>,
                    }}
                />
                <Tabs.Screen
                    name="perfil"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="alertas"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="proveedores"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="index_new"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
            <FloatingButton />
        </>
    );
}

const styles = StyleSheet.create({
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
    },
    floatingButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#fff',
    },
    floatingButtonText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: 32,
    },
});
