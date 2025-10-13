
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== 'ios' && styles.contentContainerWithTabBar
        ]}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.circle.fill" size={80} color={colors.primary} />
          </View>
          <Text style={styles.name}>Administrador</Text>
          <Text style={styles.role}>Gerente</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol name="cart.fill" size={32} color={colors.primary} />
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="clock.fill" size={32} color={colors.warning} />
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol name="eurosign.circle.fill" size={32} color={colors.accent} />
              <Text style={styles.statValue}>€842</Text>
              <Text style={styles.statLabel}>Ingresos</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.card}>
            <Pressable style={styles.menuItem} onPress={() => console.log('Usuarios')}>
              <View style={styles.menuItemLeft}>
                <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Gestión de Usuarios</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable 
              style={styles.menuItem} 
              onPress={() => router.push('/printer-settings')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="printer.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Configurar Impresora</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => console.log('Notificaciones')}>
              <View style={styles.menuItemLeft}>
                <IconSymbol name="bell.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Notificaciones</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => console.log('WhatsApp')}>
              <View style={styles.menuItemLeft}>
                <IconSymbol name="message.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Integración WhatsApp</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={[styles.menuItem, styles.menuItemLast]} onPress={() => console.log('Email')}>
              <View style={styles.menuItemLeft}>
                <IconSymbol name="envelope.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Configuración de Email</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versión</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última actualización</Text>
              <Text style={styles.infoValue}>Hoy</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          onPress={() => console.log('Cerrar sesión')}
        >
          <IconSymbol name="arrow.right.square.fill" size={20} color={colors.card} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: colors.textSecondary,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
});
