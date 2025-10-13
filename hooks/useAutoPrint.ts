
import { useEffect, useRef } from 'react';
import { usePrinter } from '@/contexts/PrinterContext';
import { Order } from '@/types/Order';

/**
 * Hook to automatically print new orders
 * @param orders - Array of orders to monitor
 */
export const useAutoPrint = (orders: Order[]) => {
  const { printOrder, isConnected, autoPrintEnabled } = usePrinter();
  const previousOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isConnected || !autoPrintEnabled) {
      console.log('Auto-print disabled or printer not connected');
      return;
    }

    // Get current order IDs
    const currentOrderIds = new Set(orders.map(order => order.id));
    
    // Find new orders (orders that weren't in the previous set)
    const newOrders = orders.filter(order => {
      const isNew = !previousOrdersRef.current.has(order.id);
      const isPending = order.status === 'pending';
      return isNew && isPending;
    });

    // Print new orders
    if (newOrders.length > 0) {
      console.log(`Found ${newOrders.length} new order(s) to print`);
      
      newOrders.forEach(async (order) => {
        console.log(`Auto-printing new order: ${order.orderNumber}`);
        const success = await printOrder(order);
        
        if (success) {
          console.log(`Successfully auto-printed order: ${order.orderNumber}`);
        } else {
          console.error(`Failed to auto-print order: ${order.orderNumber}`);
        }
      });
    }

    // Update the previous orders set
    previousOrdersRef.current = currentOrderIds;
  }, [orders, isConnected, autoPrintEnabled, printOrder]);
};
