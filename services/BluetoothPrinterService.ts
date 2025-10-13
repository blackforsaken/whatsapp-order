
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-thermal-receipt-printer-image-qr';
import { Order, OrderItem } from '@/types/Order';
import { Platform } from 'react-native';

export interface PrinterDevice {
  address: string;
  name: string;
}

class BluetoothPrinterService {
  private connectedDevice: PrinterDevice | null = null;

  /**
   * Initialize Bluetooth and check if it's enabled
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Bluetooth...');
      const isEnabled = await BluetoothManager.isBluetoothEnabled();
      
      if (!isEnabled) {
        console.log('Bluetooth is not enabled');
        if (Platform.OS === 'android') {
          await BluetoothManager.enableBluetooth();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      return false;
    }
  }

  /**
   * Scan for available Bluetooth printers
   */
  async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      console.log('Scanning for Bluetooth printers...');
      
      // Get paired devices
      const pairedDevices = await BluetoothManager.enableBluetooth();
      console.log('Paired devices:', pairedDevices);
      
      // Filter for printers (usually contain "printer" in name or are thermal printers)
      const printers: PrinterDevice[] = pairedDevices.map((device: any) => ({
        address: device.address,
        name: device.name || 'Unknown Device',
      }));
      
      return printers;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      return [];
    }
  }

  /**
   * Connect to a specific printer
   */
  async connectToPrinter(device: PrinterDevice): Promise<boolean> {
    try {
      console.log('Connecting to printer:', device.name);
      
      await BluetoothManager.connect(device.address);
      this.connectedDevice = device;
      
      console.log('Successfully connected to printer');
      return true;
    } catch (error) {
      console.error('Error connecting to printer:', error);
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
        await BluetoothManager.disconnect();
        this.connectedDevice = null;
        console.log('Disconnected from printer');
      }
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
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
   * Print an order receipt
   */
  async printOrder(order: Order): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.error('No printer connected');
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
      await BluetoothEscposPrinter.cutOnePoint();

      console.log('Order printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing order:', error);
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

      await BluetoothEscposPrinter.cutOnePoint();

      console.log('Test receipt printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing test receipt:', error);
      return false;
    }
  }
}

// Export singleton instance
export const printerService = new BluetoothPrinterService();
