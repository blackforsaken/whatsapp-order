
import { Platform } from 'react-native';
import { Order, OrderItem } from '@/types/Order';

// Conditionally import the Bluetooth library only on native platforms
let BluetoothManager: any = null;
let BluetoothEscposPrinter: any = null;

// Only import on native platforms
if (Platform.OS !== 'web') {
  try {
    const BluetoothLib = require('react-native-thermal-receipt-printer-image-qr');
    BluetoothManager = BluetoothLib.BluetoothManager;
    BluetoothEscposPrinter = BluetoothLib.BluetoothEscposPrinter;
    console.log('Bluetooth library loaded successfully');
  } catch (error) {
    console.error('Failed to load Bluetooth library:', error);
    console.log('Bluetooth printing will not be available');
  }
}

export interface PrinterDevice {
  address: string;
  name: string;
}

class BluetoothPrinterService {
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized: boolean = false;

  /**
   * Check if Bluetooth is available on this platform
   */
  isBluetoothAvailable(): boolean {
    if (Platform.OS === 'web') {
      console.log('Bluetooth is not available on web platform');
      return false;
    }

    if (!BluetoothManager || !BluetoothEscposPrinter) {
      console.log('Bluetooth library is not loaded');
      return false;
    }

    return true;
  }

  /**
   * Initialize Bluetooth and check if it's enabled
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Bluetooth...');
      
      // Check if Bluetooth is available on this platform
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        return false;
      }

      // Check if the isBluetoothEnabled method exists
      if (typeof BluetoothManager.isBluetoothEnabled !== 'function') {
        console.error('BluetoothManager.isBluetoothEnabled is not a function');
        console.log('Available BluetoothManager methods:', Object.keys(BluetoothManager || {}));
        return false;
      }

      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      console.log('Bluetooth enabled status:', isEnabled);
      
      if (!isEnabled) {
        console.log('Bluetooth is not enabled, attempting to enable...');
        if (Platform.OS === 'android') {
          try {
            await BluetoothManager.enableBluetooth();
            console.log('Bluetooth enabled successfully');
          } catch (enableError) {
            console.error('Error enabling Bluetooth:', enableError);
            return false;
          }
        } else {
          console.log('Cannot enable Bluetooth programmatically on iOS');
          return false;
        }
      }
      
      this.isInitialized = true;
      console.log('Bluetooth initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Scan for available Bluetooth printers
   */
  async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      console.log('Scanning for Bluetooth printers...');
      
      // Check if Bluetooth is available
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        return [];
      }

      // Ensure Bluetooth is initialized
      if (!this.isInitialized) {
        console.log('Bluetooth not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('Failed to initialize Bluetooth');
          return [];
        }
      }

      // Get paired devices
      const pairedDevices = await BluetoothManager.enableBluetooth();
      console.log('Paired devices:', pairedDevices);
      
      // Filter for printers (usually contain "printer" in name or are thermal printers)
      const printers: PrinterDevice[] = pairedDevices.map((device: any) => ({
        address: device.address,
        name: device.name || 'Unknown Device',
      }));
      
      console.log('Found printers:', printers);
      return printers;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }
  }

  /**
   * Connect to a specific printer
   */
  async connectToPrinter(device: PrinterDevice): Promise<boolean> {
    try {
      console.log('Connecting to printer:', device.name);
      
      // Check if Bluetooth is available
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        return false;
      }

      // Ensure Bluetooth is initialized
      if (!this.isInitialized) {
        console.log('Bluetooth not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('Failed to initialize Bluetooth');
          return false;
        }
      }

      await BluetoothManager.connect(device.address);
      this.connectedDevice = device;
      
      console.log('Successfully connected to printer');
      return true;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.connectedDevice = null;
      return false;
    }
  }

  /**
   * Disconnect from current printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connectedDevice) {
        console.log('Disconnecting from printer...');
        
        // Check if Bluetooth is available
        if (!this.isBluetoothAvailable()) {
          console.error('Bluetooth is not available on this platform');
          this.connectedDevice = null;
          return;
        }

        await BluetoothManager.disconnect();
        this.connectedDevice = null;
        console.log('Disconnected from printer');
      }
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.connectedDevice = null;
    }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  /**
   * Get connected device info
   */
  getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }

  /**
   * Verify actual Bluetooth connection status
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        return false;
      }

      // Check if Bluetooth is available
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        this.connectedDevice = null;
        return false;
      }

      // Try to check connection status
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isEnabled) {
        console.log('Bluetooth is disabled');
        this.connectedDevice = null;
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying connection:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.connectedDevice = null;
      return false;
    }
  }

  /**
   * Print an order receipt
   */
  async printOrder(order: Order): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.error('No printer connected');
        return false;
      }

      // Check if Bluetooth is available
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        return false;
      }

      // Verify connection before printing
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        console.error('Printer connection lost');
        return false;
      }

      console.log('Printing order:', order.orderNumber);

      // Print header
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER
      );
      await BluetoothEscposPrinter.printText('================================\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('NUEVO PEDIDO\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('================================\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('\n', {});

      // Print order number and time
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT
      );
      await BluetoothEscposPrinter.printText(`Pedido: ${order.orderNumber}\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText(
        `Fecha: ${order.createdAt.toLocaleDateString('es-ES')} ${order.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`,
        {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        }
      );
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Print customer info
      await BluetoothEscposPrinter.printText('\nCLIENTE:\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText(`${order.customerName}\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText(`Tel: ${order.customerPhone}\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      
      if (order.customerAddress) {
        await BluetoothEscposPrinter.printText(`Dir: ${order.customerAddress}\n`, {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });
      }
      
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Print items
      await BluetoothEscposPrinter.printText('\nARTICULOS:\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });

      for (const item of order.items) {
        // Item name and quantity
        await BluetoothEscposPrinter.printText(
          `${item.quantity}x ${item.name}\n`,
          {
            encoding: 'GBK',
            codepage: 0,
            widthtimes: 0,
            heigthtimes: 0,
            fonttype: 1,
          }
        );

        // Item price
        const itemTotal = (item.price * item.quantity).toFixed(2);
        await BluetoothEscposPrinter.printText(`   ${itemTotal} EUR\n`, {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });

        // Item notes if any
        if (item.notes) {
          await BluetoothEscposPrinter.printText(`   Nota: ${item.notes}\n`, {
            encoding: 'GBK',
            codepage: 0,
            widthtimes: 0,
            heigthtimes: 0,
            fonttype: 1,
          });
        }
        
        await BluetoothEscposPrinter.printText('\n', {});
      }

      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Print total
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.RIGHT
      );
      await BluetoothEscposPrinter.printText(`TOTAL: ${order.totalAmount.toFixed(2)} EUR\n`, {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });

      // Print notes if any
      if (order.notes) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.LEFT
        );
        await BluetoothEscposPrinter.printText('\n--------------------------------\n', {});
        await BluetoothEscposPrinter.printText('NOTAS:\n', {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });
        await BluetoothEscposPrinter.printText(`${order.notes}\n`, {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });
      }

      // Print footer
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER
      );
      await BluetoothEscposPrinter.printText('\n================================\n', {});
      await BluetoothEscposPrinter.printText('Gracias por su pedido!\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('================================\n\n\n', {});

      // Cut paper (if supported)
      try {
        await BluetoothEscposPrinter.cutOnePoint();
      } catch (cutError) {
        console.log('Paper cut not supported or failed:', cutError);
        // Continue anyway, this is not critical
      }

      console.log('Order printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing order:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If printing fails, the connection might be lost
      this.connectedDevice = null;
      
      return false;
    }
  }

  /**
   * Print a test receipt
   */
  async printTest(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.error('No printer connected');
        return false;
      }

      // Check if Bluetooth is available
      if (!this.isBluetoothAvailable()) {
        console.error('Bluetooth is not available on this platform');
        return false;
      }

      // Verify connection before printing
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        console.error('Printer connection lost');
        return false;
      }

      console.log('Printing test receipt...');

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER
      );
      await BluetoothEscposPrinter.printText('================================\n', {});
      await BluetoothEscposPrinter.printText('PRUEBA DE IMPRESION\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1,
      });
      await BluetoothEscposPrinter.printText('================================\n', {});
      await BluetoothEscposPrinter.printText('\nImpresora conectada correctamente\n', {});
      await BluetoothEscposPrinter.printText(
        `${new Date().toLocaleString('es-ES')}\n`,
        {}
      );
      await BluetoothEscposPrinter.printText('\n================================\n\n\n', {});

      try {
        await BluetoothEscposPrinter.cutOnePoint();
      } catch (cutError) {
        console.log('Paper cut not supported or failed:', cutError);
        // Continue anyway, this is not critical
      }

      console.log('Test receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing test receipt:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If printing fails, the connection might be lost
      this.connectedDevice = null;
      
      return false;
    }
  }
}

// Export singleton instance
export const printerService = new BluetoothPrinterService();
