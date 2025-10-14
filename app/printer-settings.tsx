
import React, { useState, useEffect, useCallback } from 'react';
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
  const [isTesting, setIsTesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>(null);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);

  const checkConnection = useCallback(async () => {
    console.log('Checking printer connection...');
    const device = printerService.getConnectedDevice();
    
    if (device) {
      // Verify the connection is still active
      const isConnected = await printerService.verifyConnection();
      
      if (isConnected) {
        setConnectedPrinter(device);
        console.log('Printer connected:', device.name);
      } else {
        setConnectedPrinter(null);
        console.log('Printer connection lost');
      }
    } else {
      setConnectedPrinter(null);
      console.log('No printer connected');
    }
  }, []);

  const initializeBluetooth = useCallback(async () => {
    console.log('Initializing Bluetooth in settings...');
    setIsInitializing(true);
    
    try {
      const initialized = await printerService.initialize();
      console.log('Bluetooth initialization result:', initialized);
      setIsBluetoothEnabled(initialized);
      
      if (initialized) {
        await checkConnection();
      } else {
        Alert.alert(
          'Bluetooth desactivado',
          Platform.OS === 'android' 
            ? 'No se pudo activar el Bluetooth. Por favor, actívalo manualmente en la configuración de tu dispositivo.'
            : 'Por favor, activa el Bluetooth en la configuración de tu dispositivo para usar la impresora.',
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      Alert.alert(
        'Error',
        'No se pudo inicializar el Bluetooth. Asegúrate de que tu dispositivo tenga Bluetooth y que la app tenga los permisos necesarios.'
      );
    } finally {
      setIsInitializing(false);
    }
  }, [checkConnection]);

  useEffect(() => {
    initializeBluetooth();
  }, [initializeBluetooth]);

  const handleScanPrinters = async () => {
    console.log('Scanning for printers...');
    setIsScanning(true);
    setPrinters([]);

    try {
      const foundPrinters = await printerService.scanForPrinters();
      console.log('Found printers:', foundPrinters);
      
      if (foundPrinters.length === 0) {
        Alert.alert(
          'No se encontraron impresoras',
          'Asegúrate de que:\n\n' +
          '- Tu impresora Bluetooth esté encendida\n' +
          '- La impresora esté emparejada con este dispositivo en la configuración de Bluetooth\n' +
          '- La impresora esté dentro del alcance',
          [
            {
              text: 'OK',
            },
          ]
        );
      } else {
        setPrinters(foundPrinters);
      }
    } catch (error) {
      console.error('Error scanning for printers:', error);
      Alert.alert(
        'Error',
        'No se pudo escanear las impresoras. Verifica que el Bluetooth esté activado y que la app tenga los permisos necesarios.'
      );
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
        setConnectedPrinter(device);
        Alert.alert('Éxito', `Conectado a ${device.name}`);
      } else {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar a la impresora. Asegúrate de que:\n\n' +
          '- La impresora esté encendida\n' +
          '- La impresora esté dentro del alcance\n' +
          '- No esté conectada a otro dispositivo',
          [
            {
              text: 'Reintentar',
              onPress: () => handleConnectPrinter(device),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      Alert.alert('Error', 'Ocurrió un error al conectar con la impresora.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    console.log('Disconnecting from printer...');
    
    Alert.alert(
      'Desconectar impresora',
      '¿Estás seguro de que deseas desconectar la impresora?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              await printerService.disconnect();
              setConnectedPrinter(null);
              Alert.alert('Desconectado', 'La impresora ha sido desconectada.');
            } catch (error) {
              console.error('Error disconnecting:', error);
              Alert.alert('Error', 'No se pudo desconectar la impresora.');
            }
          },
        },
      ]
    );
  };

  const handlePrintTest = async () => {
    console.log('Printing test receipt...');
    
    if (!connectedPrinter) {
      Alert.alert('Error', 'No hay ninguna impresora conectada.');
      return;
    }

    setIsTesting(true);

    try {
      // Verify connection before testing
      const isConnected = await printerService.verifyConnection();
      
      if (!isConnected) {
        Alert.alert(
          'Conexión perdida',
          'La conexión con la impresora se ha perdido. Por favor, reconecta la impresora.',
        );
        setConnectedPrinter(null);
        setIsTesting(false);
        return;
      }

      const success = await printerService.printTest();

      if (success) {
        Alert.alert('Éxito', 'Impresión de prueba completada.');
      } else {
        Alert.alert(
          'Error de impresión',
          'No se pudo imprimir la prueba. Verifica que:\n\n' +
          '- La impresora esté encendida\n' +
          '- La impresora tenga papel\n' +
          '- La conexión Bluetooth esté activa',
          [
            {
              text: 'Reintentar',
              onPress: () => handlePrintTest(),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error printing test:', error);
      Alert.alert('Error', 'Ocurrió un error al imprimir la prueba.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configuración de Impresora',
          headerBackTitle: 'Atrás',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bluetooth Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de Bluetooth</Text>
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <IconSymbol
                  name={isBluetoothEnabled ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  size={24}
                  color={isBluetoothEnabled ? colors.success : colors.danger}
                />
                <Text style={styles.statusText}>
                  {isBluetoothEnabled ? 'Bluetooth activado' : 'Bluetooth desactivado'}
                </Text>
              </View>
              {!isBluetoothEnabled && (
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary },
                    pressed && styles.buttonPressed,
                    isInitializing && styles.buttonDisabled,
                  ]}
                  onPress={initializeBluetooth}
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <ActivityIndicator color={colors.card} />
                  ) : (
                    <IconSymbol name="bolt.fill" size={20} color={colors.card} />
                  )}
                  <Text style={styles.buttonText}>
                    {isInitializing ? 'Activando...' : 'Activar Bluetooth'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Connected Printer */}
          {connectedPrinter && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Impresora Conectada</Text>
              <View style={styles.card}>
                <View style={styles.printerInfo}>
                  <IconSymbol name="printer.fill" size={32} color={colors.success} />
                  <View style={styles.printerDetails}>
                    <Text style={styles.printerName}>{connectedPrinter.name}</Text>
                    <Text style={styles.printerAddress}>{connectedPrinter.address}</Text>
                  </View>
                </View>
                <View style={styles.buttonGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      { backgroundColor: colors.info },
                      pressed && styles.buttonPressed,
                      isTesting && styles.buttonDisabled,
                    ]}
                    onPress={handlePrintTest}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <ActivityIndicator color={colors.card} />
                    ) : (
                      <IconSymbol name="doc.text.fill" size={20} color={colors.card} />
                    )}
                    <Text style={styles.buttonText}>
                      {isTesting ? 'Imprimiendo...' : 'Imprimir Prueba'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      { backgroundColor: colors.danger },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleDisconnect}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color={colors.card} />
                    <Text style={styles.buttonText}>Desconectar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Scan for Printers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buscar Impresoras</Text>
            <View style={styles.card}>
              <Text style={styles.infoText}>
                Asegúrate de que tu impresora Bluetooth esté encendida y emparejada con este dispositivo en la configuración de Bluetooth.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: colors.primary },
                  pressed && styles.buttonPressed,
                  (isScanning || !isBluetoothEnabled) && styles.buttonDisabled,
                ]}
                onPress={handleScanPrinters}
                disabled={isScanning || !isBluetoothEnabled}
              >
                {isScanning ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <IconSymbol name="magnifyingglass" size={20} color={colors.card} />
                )}
                <Text style={styles.buttonText}>
                  {isScanning ? 'Buscando...' : 'Buscar Impresoras'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Available Printers */}
          {printers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Impresoras Disponibles</Text>
              {printers.map((printer) => (
                <Pressable
                  key={printer.address}
                  style={({ pressed }) => [
                    styles.printerCard,
                    pressed && styles.printerCardPressed,
                    connectedPrinter?.address === printer.address && styles.printerCardConnected,
                  ]}
                  onPress={() => handleConnectPrinter(printer)}
                  disabled={isConnecting || connectedPrinter?.address === printer.address}
                >
                  <View style={styles.printerInfo}>
                    <IconSymbol
                      name="printer.fill"
                      size={28}
                      color={
                        connectedPrinter?.address === printer.address
                          ? colors.success
                          : colors.textSecondary
                      }
                    />
                    <View style={styles.printerDetails}>
                      <Text style={styles.printerName}>{printer.name}</Text>
                      <Text style={styles.printerAddress}>{printer.address}</Text>
                    </View>
                  </View>
                  {connectedPrinter?.address === printer.address ? (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                  ) : (
                    <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Help Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayuda</Text>
            <View style={styles.card}>
              <Text style={styles.helpTitle}>Problemas de conexión:</Text>
              <Text style={styles.helpText}>
                - Asegúrate de que la impresora esté encendida{'\n'}
                - Verifica que el Bluetooth esté activado{'\n'}
                - Empareja la impresora en la configuración de Bluetooth de tu dispositivo{'\n'}
                - Mantén la impresora cerca del dispositivo{'\n'}
                - Reinicia la impresora si es necesario{'\n'}
                - Verifica que la app tenga permisos de Bluetooth
              </Text>
            </View>
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
    gap: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  printerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  printerDetails: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.card,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  printerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  printerCardPressed: {
    opacity: 0.7,
  },
  printerCardConnected: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
