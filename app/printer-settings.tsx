
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
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { printerService, PrinterDevice } from '@/services/BluetoothPrinterService';
import { colors } from '@/styles/commonStyles';
import { Stack, useRouter } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  connectedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 20,
  },
});

const PrinterSettingsScreen = () => {
  const router = useRouter();
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);

  const initializeBluetooth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Bluetooth is available on this platform
      if (!printerService.isBluetoothAvailable()) {
        if (Platform.OS === 'web') {
          setError('Bluetooth no está disponible en la versión web. Por favor, usa la app en un dispositivo móvil.');
        } else {
          setError('La librería de Bluetooth no está disponible. Asegúrate de que la app esté instalada correctamente.');
        }
        setIsLoading(false);
        return;
      }

      console.log('Initializing Bluetooth...');
      const initialized = await printerService.initialize();
      
      if (initialized) {
        setIsBluetoothEnabled(true);
        console.log('Bluetooth initialized successfully');
        Alert.alert('Éxito', 'Bluetooth activado correctamente');
      } else {
        setIsBluetoothEnabled(false);
        setError('No se pudo activar el Bluetooth. Por favor, actívalo manualmente en la configuración de tu dispositivo.');
        Alert.alert(
          'Error',
          'No se pudo activar el Bluetooth. Por favor, actívalo manualmente en la configuración de tu dispositivo.'
        );
      }
    } catch (err) {
      console.error('Error initializing Bluetooth:', err);
      setError(`Error al inicializar Bluetooth: ${err}`);
      Alert.alert('Error', `Error al inicializar Bluetooth: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScanPrinters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Bluetooth is available
      if (!printerService.isBluetoothAvailable()) {
        setError('Bluetooth no está disponible en esta plataforma');
        setIsLoading(false);
        return;
      }

      console.log('Scanning for printers...');
      const printers = await printerService.scanForPrinters();
      
      if (printers.length === 0) {
        setError('No se encontraron impresoras. Asegúrate de que tu impresora esté encendida y emparejada con tu dispositivo.');
        Alert.alert(
          'Sin impresoras',
          'No se encontraron impresoras. Asegúrate de que tu impresora esté encendida y emparejada con tu dispositivo.'
        );
      } else {
        console.log(`Found ${printers.length} printers`);
      }
      
      setAvailablePrinters(printers);
    } catch (err) {
      console.error('Error scanning for printers:', err);
      setError(`Error al buscar impresoras: ${err}`);
      Alert.alert('Error', `Error al buscar impresoras: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConnectPrinter = useCallback(async (device: PrinterDevice) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Connecting to printer:', device.name);
      const connected = await printerService.connectToPrinter(device);
      
      if (connected) {
        setConnectedPrinter(device);
        Alert.alert('Éxito', `Conectado a ${device.name}`);
      } else {
        setError(`No se pudo conectar a ${device.name}`);
        Alert.alert('Error', `No se pudo conectar a ${device.name}`);
      }
    } catch (err) {
      console.error('Error connecting to printer:', err);
      setError(`Error al conectar: ${err}`);
      Alert.alert('Error', `Error al conectar: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Disconnecting from printer...');
      await printerService.disconnect();
      setConnectedPrinter(null);
      Alert.alert('Desconectado', 'Impresora desconectada correctamente');
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(`Error al desconectar: ${err}`);
      Alert.alert('Error', `Error al desconectar: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePrintTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Printing test receipt...');
      const success = await printerService.printTest();
      
      if (success) {
        Alert.alert('Éxito', 'Impresión de prueba completada');
      } else {
        setError('No se pudo imprimir la prueba');
        Alert.alert('Error', 'No se pudo imprimir la prueba. Verifica que la impresora esté conectada.');
      }
    } catch (err) {
      console.error('Error printing test:', err);
      setError(`Error al imprimir: ${err}`);
      Alert.alert('Error', `Error al imprimir: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check initial connection status
    const device = printerService.getConnectedDevice();
    if (device) {
      setConnectedPrinter(device);
    }

    // Initialize Bluetooth on mount if on native platform
    if (Platform.OS !== 'web') {
      initializeBluetooth();
    }
  }, [initializeBluetooth]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuración de Impresora',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={styles.content}>
        {Platform.OS === 'web' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ La impresión Bluetooth no está disponible en la versión web. 
              Por favor, usa la aplicación en un dispositivo móvil (iOS o Android) 
              para acceder a esta funcionalidad.
            </Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Bluetooth Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Bluetooth</Text>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              {isBluetoothEnabled 
                ? '✓ Bluetooth activado' 
                : 'Bluetooth no activado'}
            </Text>
          </View>
          
          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={initializeBluetooth}
            disabled={isLoading || Platform.OS === 'web'}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Activando...' : 'Activar Bluetooth'}
            </Text>
          </Pressable>
        </View>

        {/* Connected Printer Section */}
        {connectedPrinter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Impresora Conectada</Text>
            <View style={styles.card}>
              <View style={styles.printerItem}>
                <View style={styles.printerInfo}>
                  <Text style={styles.printerName}>{connectedPrinter.name}</Text>
                  <Text style={styles.printerAddress}>{connectedPrinter.address}</Text>
                </View>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>Conectado</Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
              onPress={handlePrintTest}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Imprimiendo...' : 'Imprimir Prueba'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.dangerButton, isLoading && styles.buttonDisabled]}
              onPress={handleDisconnect}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Desconectando...' : 'Desconectar'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Available Printers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impresoras Disponibles</Text>
          
          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleScanPrinters}
            disabled={isLoading || !isBluetoothEnabled || Platform.OS === 'web'}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Buscando...' : 'Buscar Impresoras'}
            </Text>
          </Pressable>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {!isLoading && availablePrinters.length === 0 && (
            <Text style={styles.emptyText}>
              No se encontraron impresoras. Presiona &quot;Buscar Impresoras&quot; para escanear.
            </Text>
          )}

          {!isLoading && availablePrinters.map((printer) => (
            <View key={printer.address} style={styles.printerItem}>
              <View style={styles.printerInfo}>
                <Text style={styles.printerName}>{printer.name}</Text>
                <Text style={styles.printerAddress}>{printer.address}</Text>
              </View>
              
              {connectedPrinter?.address === printer.address ? (
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>Conectado</Text>
                </View>
              ) : (
                <Pressable
                  style={styles.connectButton}
                  onPress={() => handleConnectPrinter(printer)}
                  disabled={isLoading}
                >
                  <Text style={styles.connectButtonText}>Conectar</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <View style={styles.card}>
            <Text style={[styles.infoText, { textAlign: 'left' }]}>
              1. Asegúrate de que tu impresora Bluetooth esté encendida{'\n'}
              2. Empareja la impresora con tu dispositivo en Configuración{'\n'}
              3. Presiona &quot;Activar Bluetooth&quot; en esta pantalla{'\n'}
              4. Presiona &quot;Buscar Impresoras&quot; para encontrar dispositivos{'\n'}
              5. Selecciona tu impresora de la lista{'\n'}
              6. Prueba la conexión con &quot;Imprimir Prueba&quot;
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrinterSettingsScreen;
