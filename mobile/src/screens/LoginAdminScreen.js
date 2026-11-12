import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTema } from '../context/TemaContext'
import { useAuth } from '../context/AuthContext'
import { obtenerErrorApi } from '../api/client'
import { Boton, Mensaje } from '../components/Controles'

export default function LoginAdminScreen({ navigation }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviarFormulario() {
    const emailNormalizado = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setError('Ingresá un email válido.')
      return
    }
    if (!password) {
      setError('Ingresá tu contraseña.')
      return
    }

    setEnviando(true)
    setError('')
    try {
      await login({ email: emailNormalizado, password })
      navigation.goBack()
    } catch (errorLogin) {
      setError(obtenerErrorApi(errorLogin, 'No se pudo iniciar sesión.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={estilos.titulo}>Iniciar sesión</Text>
        <Text style={estilos.descripcion}>
          Ingresá con tu cuenta de administrador de Alebourg.
        </Text>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Tu email"
            placeholderTextColor={colores.secundaria}
            returnKeyType="next"
            style={estilos.entrada}
            value={email}
          />
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Contraseña</Text>
          <View style={estilos.entradaPasswordContenedor}>
            <TextInput
              accessibilityLabel="Contraseña"
              autoComplete="current-password"
              onChangeText={setPassword}
              onSubmitEditing={enviarFormulario}
              placeholder="Tu contraseña"
              placeholderTextColor={colores.secundaria}
              returnKeyType="done"
              secureTextEntry={!mostrarPassword}
              style={[estilos.entrada, estilos.entradaPassword]}
              value={password}
            />
            <Pressable
              accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setMostrarPassword((actual) => !actual)}
              style={estilos.botonMostrarPassword}
            >
              <Feather
                name={mostrarPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colores.secundaria}
              />
            </Pressable>
          </View>
        </View>

        {!!error && (
          <Mensaje titulo="No se pudo iniciar sesión" detalle={error} tipo="error" />
        )}

        <Boton
          titulo="Iniciar sesión"
          onPress={enviarFormulario}
          cargando={enviando}
        />
        <Boton
          titulo="Volver"
          variante="secundario"
          onPress={() => navigation.goBack()}
          deshabilitado={enviando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { flexGrow: 1, justifyContent: 'center', padding: 22, gap: 18 },
    titulo: { color: colores.tinta, fontSize: 26, fontWeight: '800' },
    descripcion: { color: colores.secundaria, fontSize: 15, lineHeight: 22 },
    campo: { gap: 8 },
    etiqueta: { color: colores.tinta, fontSize: 14, fontWeight: '700' },
    entrada: {
      minHeight: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colores.linea,
      borderRadius: 12,
      backgroundColor: colores.superficie,
      color: colores.tinta,
      fontSize: 16,
    },
    entradaPasswordContenedor: { position: 'relative' },
    entradaPassword: { paddingRight: 48 },
    botonMostrarPassword: {
      position: 'absolute',
      top: 0,
      right: 12,
      bottom: 0,
      justifyContent: 'center',
    },
  })
}
