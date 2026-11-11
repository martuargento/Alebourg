import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Feather } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import TiendaScreen from '../screens/TiendaScreen'
import CarritoScreen from '../screens/CarritoScreen'
import CuentaScreen from '../screens/CuentaScreen'
import DetalleProductoScreen from '../screens/DetalleProductoScreen'
import LoginAdminScreen from '../screens/LoginAdminScreen'
import AdminRangosScreen from '../screens/AdminRangosScreen'
import AdminProductoScreen from '../screens/AdminProductoScreen'
import { useTema } from '../context/TemaContext'
import { useCantidadCarrito } from '../context/CarritoContext'

const Tabs = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function IconoPestana({ routeName, color, size }) {
  const cantidadTotal = useCantidadCarrito()
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const iconos = { Tienda: 'grid', Carrito: 'shopping-cart', Cuenta: 'user' }
  const mostrarCantidad = routeName === 'Carrito' && cantidadTotal > 0

  return (
    <View>
      <Feather name={iconos[routeName]} size={size} color={color} />
      {mostrarCantidad && (
        <View style={estilos.insignia}>
          <Text style={estilos.textoInsignia}>
            {cantidadTotal > 99 ? '99+' : cantidadTotal}
          </Text>
        </View>
      )}
    </View>
  )
}

function NavegacionPrincipal() {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: colores.fondo },
        tabBarActiveTintColor: colores.cta,
        tabBarInactiveTintColor: colores.secundaria,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
        tabBarStyle: {
          borderTopColor: colores.linea,
          backgroundColor: colores.superficie,
        },
        tabBarIcon: ({ color, size }) => (
          <IconoPestana routeName={route.name} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="Tienda" component={TiendaScreen} options={{ title: 'Tienda' }} />
      <Tabs.Screen name="Carrito" component={CarritoScreen} options={{ title: 'Carrito' }} />
      <Tabs.Screen name="Cuenta" component={CuentaScreen} options={{ title: 'Cuenta' }} />
    </Tabs.Navigator>
  )
}

export default function AppNavigator() {
  const { colores } = useTema()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="Principal" component={NavegacionPrincipal} />
      <Stack.Screen name="DetalleProducto" component={DetalleProductoScreen} />
      <Stack.Screen name="IniciarSesion" component={LoginAdminScreen} />
      <Stack.Screen name="AdminRangos" component={AdminRangosScreen} />
      <Stack.Screen name="AdminProducto" component={AdminProductoScreen} />
    </Stack.Navigator>
  )
}

function crearEstilos(colores) {
  return {
  insignia: {
    position: 'absolute',
    top: -6,
    right: -11,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.cta,
  },
  textoInsignia: { color: colores.tinta, fontSize: 10, fontWeight: '800' },
  }
}
