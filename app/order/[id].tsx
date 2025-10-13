
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Linking } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { mockOrders } from "@/data/mockOrders";
import { Order, OrderStatus } from "@/types/Order";
import { printerService } from "@/services/BluetoothPrinterService";

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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | undefined>(
    mockOrders.find((o) => o.id === id)
  );
  const [isPrinting, setIsPrinting] = useState(false);

  if (!order) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Pedido no encontrado",
            headerBackTitle: "Atrás",
          }}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.danger} />
          <Text style={styles.errorText}>Pedido no encontrado</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    console.log('Changing status to:', newStatus);
    setOrder({ ...order, status: newStatus, updatedAt: new Date() });
  };

  const handlePrint = async () => {
    console.log('Print button pressed for order:', order.id);
    
    // Check if printer is connected
    if (!printerService.isConnected()) {
      console.log('Printer not connected');
      Alert.alert(
        'Impresora no conectada',
        '¿Deseas configurar una impresora ahora?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Configurar',
            onPress: () => router.push('/printer-settings'),
          },
        ]
      );
      return;
    }

    setIsPrinting(true);
    console.log('Starting print process...');
    
    try {
      // Verify connection before printing
      const isConnected = await printerService.verifyConnection();
      
      if (!isConnected) {
        console.log('Printer connection verification failed');
        Alert.alert(
          'Conexión perdida',
          'La conexión con la impresora se ha perdido. Por favor, reconecta la impresora.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/printer-settings'),
            },
          ]
        );
        setIsPrinting(false);
        return;
      }

      console.log('Connection verified, printing order...');
      const printed = await printerService.printOrder(order);
      
      if (printed) {
        console.log('Order printed successfully');
        Alert.alert('Éxito', 'Pedido impreso correctamente.');
      } else {
        console.log('Print failed');
        Alert.alert(
          'Error de impresión',
          'No se pudo imprimir el pedido. Verifica que la impresora esté encendida y tenga papel.',
          [
            {
              text: 'Reintentar',
              onPress: () => handlePrint(),
            },
            {
              text: 'Configurar',
              onPress: () => router.push('/printer-settings'),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error printing order:', error);
      Alert.alert(
        'Error',
        `Ocurrió un error al imprimir el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [
          {
            text: 'Reintentar',
            onPress: () => handlePrint(),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWhatsApp = async () => {
    console.log('Opening WhatsApp for:', order.customerPhone);
    
    try {
      // Remove any non-numeric characters from phone number
      const phoneNumber = order.customerPhone.replace(/\D/g, '');
      
      // Create WhatsApp message
      const message = `Hola ${order.customerName}, tu pedido ${order.orderNumber} está ${getStatusText(order.status).toLowerCase()}.`;
      
      // WhatsApp URL
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      
      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo.');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: order.orderNumber,
          headerBackTitle: "Atrás",
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado del Pedido</Text>
            <View style={[styles.statusCard, { borderLeftColor: getStatusColor(order.status) }]}>
              <Text style={[styles.statusLabel, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
              <Text style={styles.statusTime}>
                Actualizado: {order.updatedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* Customer Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{order.customerName}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <IconSymbol name="phone.fill" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{order.customerPhone}</Text>
                </View>
              </View>
              {order.customerAddress && (
                <View style={styles.infoRow}>
                  <IconSymbol name="location.fill" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoValue}>{order.customerAddress}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artículos</Text>
            <View style={styles.card}>
              {order.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    index < order.items.length - 1 && styles.itemRowBorder,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.notes && (
                        <Text style={styles.itemNotes}>{item.notes}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>€{order.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Notes Section */}
          {order.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <View style={styles.card}>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <View style={styles.actionsGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                  pressed && styles.actionButtonPressed,
                  isPrinting && styles.actionButtonDisabled,
                ]}
                onPress={handlePrint}
                disabled={isPrinting}
              >
                <IconSymbol name="printer.fill" size={24} color={colors.card} />
                <Text style={styles.actionButtonText}>
                  {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.success },
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleWhatsApp}
              >
                <IconSymbol name="message.fill" size={24} color={colors.card} />
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>

          {/* Status Change Buttons */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cambiar Estado</Text>
              <View style={styles.statusButtons}>
                {order.status === 'pending' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.statusButton,
                      { backgroundColor: colors.info },
                      pressed && styles.statusButtonPressed,
                    ]}
                    onPress={() => handleStatusChange('preparing')}
                  >
                    <Text style={styles.statusButtonText}>Marcar como Preparando</Text>
                  </Pressable>
                )}
                {order.status === 'preparing' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.statusButton,
                      { backgroundColor: colors.success },
                      pressed && styles.statusButtonPressed,
                    ]}
                    onPress={() => handleStatusChange('ready')}
                  >
                    <Text style={styles.statusButtonText}>Marcar como Listo</Text>
                  </Pressable>
                )}
                {order.status === 'ready' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.statusButton,
                      { backgroundColor: colors.secondary },
                      pressed && styles.statusButtonPressed,
                    ]}
                    onPress={() => handleStatusChange('delivered')}
                  >
                    <Text style={styles.statusButtonText}>Marcar como Entregado</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.statusButton,
                    styles.cancelButton,
                    pressed && styles.statusButtonPressed,
                  ]}
                  onPress={() => handleStatusChange('cancelled')}
                >
                  <Text style={styles.statusButtonText}>Cancelar Pedido</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 30,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.highlight,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonPressed: {
    opacity: 0.7,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  cancelButton: {
    backgroundColor: colors.danger,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
});
