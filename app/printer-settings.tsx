
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { printerService, PrinterDevice } from '@/services/BluetoothPrinterService';

export default function PrinterSettingsScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);

  useEffect(() => {
    initializeBluetooth();
    checkConnection();
  }, []);

  const initializeBluetooth = async () => {
    console.log('Initializing Bluetooth...');
    const initialized = await printerService.initialize();
    if (!initialized) {
      Alert.alert(
        'Error',
        'No se pudo inicializar Bluetooth. Por favor, habilita Bluetooth en la configuración de tu dispositivo.'
      );
    }
  };

  const checkConnection = () => {
    const device = printerService.getConnectedDevice();
    setConnectedDevice(device);
  };

  const handleScanPrinters = async () => {
    console.log('Starting printer scan...');
    setIsScanning(true);
    setPrinters([]);

    try {
      const foundPrinters = await printerService.scanForPrinters();
      console.log('Found printers:', foundPrinters);
      setPrinters(foundPrinters);

      if (foundPrinters.length === 0) {
        Alert.alert(
          'No se encontraron impresoras',
          'Asegúrate de que tu impresora Bluetooth esté encendida y emparejada con este dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error scanning printers:', error);
      Alert.alert('Error', 'No se pudo escanear impresoras Bluetooth.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectPrinter = async (device: PrinterDevice) => {
    console.log('Connecting to printer:', device.name);
    setIsConnecting(true);

    try {
      const connected = await printerService.connectToPrinter(device);

      if (connected) {
        setConnectedDevice(device);
        Alert.alert('Conectado', `Conectado a ${device.name} exitosamente.`);
      } else {
        Alert.alert('Error', 'No se pudo conectar a la impresora.');
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      Alert.alert('Error', 'No se pudo conectar a la impresora.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    console.log('Disconnecting from printer...');
    try {
      await printerService.disconnect();
      setConnectedDevice(null);
      Alert.alert('Desconectado', 'Impresora desconectada exitosamente.');
    } catch (error) {
      console.error('Error disconnecting:', error);
      Alert.alert('Error', 'No se pudo desconectar la impresora.');
    }
  };

  const handlePrintTest = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No hay impresora conectada.');
      return;
    }

    console.log('Printing test receipt...');
    setIsPrinting(true);

    try {
      const printed = await printerService.printTest();

      if (printed) {
        Alert.alert('Éxito', 'Recibo de prueba impreso correctamente.');
      } else {
        Alert.alert('Error', 'No se pudo imprimir el recibo de prueba.');
      }
    } catch (error) {
      console.error('Error printing test:', error);
      Alert.alert('Error', 'No se pudo imprimir el recibo de prueba.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configurar Impresora',
          headerBackTitle: 'Atrás',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Connection Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de Conexión</Text>
            <View style={styles.card}>
              {connectedDevice ? (
                <>
                  <View style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={24}
                        color={colors.success}
                      />
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>Conectado</Text>
                        <Text style={styles.statusValue}>{connectedDevice.name}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.buttonRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.button,
                        styles.testButton,
                        pressed && styles.buttonPressed,
                        isPrinting && styles.buttonDisabled,
                      ]}
                      onPress={handlePrintTest}
                      disabled={isPrinting}
                    >
                      {isPrinting ? (
                        <ActivityIndicator color={colors.card} size="small" />
                      ) : (
                        <>
                          <IconSymbol name="printer.fill" size={20} color={colors.card} />
                          <Text style={styles.buttonText}>Imprimir Prueba</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.button,
                        styles.disconnectButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={handleDisconnect}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color={colors.card} />
                      <Text style={styles.buttonText}>Desconectar</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <IconSymbol
                      name="exclamationmark.circle.fill"
                      size={24}
                      color={colors.warning}
                    />
                    <View style={styles.statusInfo}>
                      <Text style={styles.statusLabel}>No conectado</Text>
                      <Text style={styles.statusDescription}>
                        Escanea y conecta una impresora Bluetooth
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Scan Button */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.scanButton,
                pressed && styles.buttonPressed,
                isScanning && styles.buttonDisabled,
              ]}
              onPress={handleScanPrinters}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator color={colors.card} size="small" />
                  <Text style={styles.scanButtonText}>Escaneando...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="magnifyingglass" size={20} color={colors.card} />
                  <Text style={styles.scanButtonText}>Escanear Impresoras</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Available Printers */}
          {printers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Impresoras Disponibles</Text>
              <View style={styles.card}>
                {printers.map((printer, index) => (
                  <Pressable
                    key={printer.address}
                    style={({ pressed }) => [
                      styles.printerItem,
                      index < printers.length - 1 && styles.printerItemBorder,
                      pressed && styles.printerItemPressed,
                    ]}
                    onPress={() => handleConnectPrinter(printer)}
                    disabled={isConnecting}
                  >
                    <View style={styles.printerLeft}>
                      <IconSymbol name="printer.fill" size={24} color={colors.primary} />
                      <View style={styles.printerInfo}>
                        <Text style={styles.printerName}>{printer.name}</Text>
                        <Text style={styles.printerAddress}>{printer.address}</Text>
                      </View>
                    </View>
                    {isConnecting ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            <View style={styles.card}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Enciende tu impresora Bluetooth y asegúrate de que esté en modo de emparejamiento.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Empareja la impresora con tu dispositivo desde la configuración de Bluetooth.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Presiona &quot;Escanear Impresoras&quot; para buscar dispositivos emparejados.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>4</Text>
                </View>
                <Text style={styles.instructionText}>
                  Selecciona tu impresora de la lista para conectarte.
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>5</Text>
                </View>
                <Text style={styles.instructionText}>
                  Usa &quot;Imprimir Prueba&quot; para verificar que la conexión funciona correctamente.
                </Text>
              </View>
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
            <Text style={styles.noteText}>
              Los pedidos nuevos se imprimirán automáticamente cuando estés conectado a una impresora.
            </Text>
          </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  disconnectButton: {
    backgroundColor: colors.danger,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  printerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  printerItemPressed: {
    opacity: 0.7,
  },
  printerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  printerAddress: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
