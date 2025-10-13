
import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { mockOrders } from "@/data/mockOrders";
import { Order, OrderStatus } from "@/types/Order";
import { useAutoPrint } from "@/hooks/useAutoPrint";
import { usePrinter } from "@/contexts/PrinterContext";

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return colors.warning;
    case 'preparing':
      return colors.info;
    case 'ready':
      return colors.success;
    case 'delivered':
      return colors.secondary;
    case 'cancelled':
      return colors.danger;
    default:
      return colors.secondary;
  }
};

const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'Preparando';
    case 'ready':
      return 'Listo';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

export default function HomeScreen() {
  const router = useRouter();
  const [orders] = useState<Order[]>(mockOrders);
  const { isConnected } = usePrinter();
  
  // Enable auto-printing for new orders
  useAutoPrint(orders);

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <Pressable
        onPress={() => router.push('/printer-settings')}
        style={styles.headerButtonContainer}
      >
        <IconSymbol 
          name="printer.fill" 
          color={isConnected ? colors.success : colors.textSecondary} 
          size={22} 
        />
      </Pressable>
      <Pressable
        onPress={() => console.log('Add new order')}
        style={styles.headerButtonContainer}
      >
        <IconSymbol name="plus" color={colors.primary} size={24} />
      </Pressable>
    </View>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => console.log('Open settings')}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="line.3.horizontal.decrease.circle" color={colors.primary} size={24} />
    </Pressable>
  );

  const handleOrderPress = (orderId: string) => {
    console.log('Order pressed:', orderId);
    router.push(`/order/${orderId}`);
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Pedidos",
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.listContainer,
            Platform.OS !== 'ios' && styles.listContainerWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order) => (
            <Pressable
              key={order.id}
              style={({ pressed }) => [
                styles.orderCard,
                pressed && styles.orderCardPressed,
              ]}
              onPress={() => handleOrderPress(order.id)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>

              <View style={styles.customerInfo}>
                <View style={styles.customerRow}>
                  <IconSymbol name="person.fill" size={16} color={colors.textSecondary} />
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={styles.customerRow}>
                  <IconSymbol name="phone.fill" size={16} color={colors.textSecondary} />
                  <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.itemsCount}>
                  <IconSymbol name="cart.fill" size={16} color={colors.textSecondary} />
                  <Text style={styles.itemsCountText}>
                    {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>€{order.totalAmount.toFixed(2)}</Text>
              </View>

              {order.notes && (
                <View style={styles.notesContainer}>
                  <IconSymbol name="note.text" size={14} color={colors.textSecondary} />
                  <Text style={styles.notesText} numberOfLines={1}>{order.notes}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listContainerWithTabBar: {
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  orderCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  orderTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  customerInfo: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  notesText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  headerButtonContainer: {
    padding: 6,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
