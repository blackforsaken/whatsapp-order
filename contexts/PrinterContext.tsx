
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { printerService } from '@/services/BluetoothPrinterService';
import { Order } from '@/types/Order';

interface PrinterContextType {
  isConnected: boolean;
  autoPrintEnabled: boolean;
  setAutoPrintEnabled: (enabled: boolean) => void;
  printOrder: (order: Order) => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};

interface PrinterProviderProps {
  children: ReactNode;
}

export const PrinterProvider: React.FC<PrinterProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  useEffect(() => {
    // Check printer connection status periodically
    const checkConnection = () => {
      const connected = printerService.isConnected();
      setIsConnected(connected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const printOrder = async (order: Order): Promise<boolean> => {
    try {
      if (!isConnected) {
        console.log('Printer not connected, skipping print');
        return false;
      }

      if (!autoPrintEnabled) {
        console.log('Auto-print disabled, skipping print');
        return false;
      }

      console.log('Auto-printing order:', order.orderNumber);
      const result = await printerService.printOrder(order);
      return result;
    } catch (error) {
      console.error('Error auto-printing order:', error);
      return false;
    }
  };

  const value: PrinterContextType = {
    isConnected,
    autoPrintEnabled,
    setAutoPrintEnabled,
    printOrder,
  };

  return <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>;
};
