import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TopCurve from '../constants/src/components/TopCurve';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TopCurve />

      <View style={styles.content}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>AI{'\n'}Task{'\n'}Planner</Text>

          <View style={styles.clipboardBox}>
            <View style={styles.clipboardTop} />
            <View style={styles.paper}>
              <View style={styles.line} />
              <View style={styles.line} />
              <View style={styles.lineShort} />
            </View>
          </View>
        </View>

        <Text style={styles.welcome}>WELCOME</Text>

        <View style={styles.messageRow}>
          <Text style={styles.message}>
            Your goals deserve a plan.{'\n'}
            Start managing your tasks today.
          </Text>

          <Image
            source={require('../assets/images/welcome-icon.jpeg')}
            style={styles.heart}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
  flex: 1,
  paddingHorizontal: 28,
  justifyContent: 'center', // 🔥 MAIN FIX
},

  // 🔥 TOP SECTION (AI Task Planner + Icon)
  logoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 40, // reduce from 80
},
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#000',
    lineHeight: 50,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 4 },
    textShadowRadius: 4,
  },

  clipboardBox: {
    width: 90,
    height: 100,
    backgroundColor: '#D28F77',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  clipboardTop: {
    position: 'absolute',
    top: -10,
    width: 30,
    height: 20,
    backgroundColor: '#D28F77',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },

  paper: {
    width: 48,
    height: 55,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 4,
    paddingTop: 10,
    paddingHorizontal: 8,
  },

  line: {
    height: 2,
    backgroundColor: '#AAA',
    marginBottom: 10,
  },

  lineShort: {
    height: 2,
    width: '70%',
    backgroundColor: '#AAA',
  },

  // 🔥 WELCOME TEXT CENTER
  welcome: {
  textAlign: 'center',
  fontSize: 34,
  fontWeight: '900',
  color: '#D300FF',
  marginBottom: 25, // 🔥 reduce gap
},

  // 🔥 MESSAGE SECTION
  messageRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 40, // 🔥 reduce
},

  message: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    textAlign: 'center', // 🔥 center like figma
    width: '75%',
  },

  heart: {
    width: 40,
    height: 35,
    marginLeft: -65,
    marginTop: -40,
  },

  // 🔥 BUTTON
  button: {
  height: 58,
  borderRadius: 30,
  backgroundColor: '#F7CCFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 20,
},

  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
});