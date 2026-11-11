import { ActivityIndicator, Platform, View } from 'react-native'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { useFonts, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as NavigationBar from 'expo-navigation-bar'
import { CarritoProvider } from './src/context/CarritoContext'
import { CatalogoProvider } from './src/context/CatalogoContext'
import { TemaProvider, useTema } from './src/context/TemaContext'
import { AuthProvider } from './src/context/AuthContext'
import { AdminPreferenciasProvider } from './src/context/AdminPreferenciasContext'
import AppNavigator from './src/navigation/AppNavigator'

function AppContenido() {
  const [fuentesCargadas] = useFonts({ Inter_500Medium, Inter_700Bold })
  const { colores: coloresTema } = useTema()

  useEffect(() => {
    if (Platform.OS !== 'android') return
    NavigationBar.setStyle('dark')
  }, [])

  if (!fuentesCargadas) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: coloresTema.fondo }}>
        <ActivityIndicator size="large" color={coloresTema.cta} />
      </View>
    )
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: coloresTema.cta,
          background: coloresTema.fondo,
          card: coloresTema.superficie,
          text: coloresTema.tinta,
          border: coloresTema.linea,
        },
      }}
    >
      <StatusBar style="dark" backgroundColor={coloresTema.fondo} />
      <AppNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <AuthProvider>
          <AdminPreferenciasProvider>
            <CarritoProvider>
              <CatalogoProvider>
                <AppContenido />
              </CatalogoProvider>
            </CarritoProvider>
          </AdminPreferenciasProvider>
        </AuthProvider>
      </TemaProvider>
    </SafeAreaProvider>
  )
}
