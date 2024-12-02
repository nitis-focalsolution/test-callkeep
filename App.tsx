/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import type {PropsWithChildren} from 'react';
import {
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Button,
  EmitterSubscription,
} from 'react-native';

import { Colors, Header } from 'react-native/Libraries/NewAppScreen';

import {
  EventType,
  VideoAspect,
  ZoomVideoSdkProvider,
  ZoomVideoSdkUser,
  ZoomView,
  useZoom,
} from "@zoom/react-native-videosdk";

import UUID from 'react-native-uuid';
import RNCallKeep from 'react-native-callkeep';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  useEffect(() => {
    const options = {
      ios: {
        appName: 'My app name',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [PermissionsAndroid.PERMISSIONS.CALL_PHONE],
        // Required to get audio in background when using Android 11
        foregroundService: {
          channelId: 'com.company.my',
          channelName: 'Foreground service for my app',
          notificationTitle: 'My app is running on background',
          notificationIcon: 'Path to the resource icon of the notification',
        }, 
      }
    };
    RNCallKeep.setup(options).then(accepted => {});
  }, [])

  const incomingcall = () => {
    setUuid(UUID.v4());
    console.log('[uuid]', uuid);
    RNCallKeep.displayIncomingCall(uuid, "TEST CALLKEEP", "TEST NURSE", 'number', false);
    console.log('[displayIncomingCall]');
    setTimeout(() => {
      RNCallKeep.endAllCalls();
    }, 5000);
  }
  const [uuid, setUuid] = useState('');
  const [zoom, setZoom] = useState(false);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title={"UUID : " + uuid}>
            {/* Read the docs to discover what to do next: */}
            {uuid}
          </Section>
          <View style={{marginBottom: 20}} />
        </View>
        <View style={{flexDirection: "row", justifyContent: 'space-around'}}>
          <TouchableOpacity
            style={{height: 60, width: 60, justifyContent: "center",}}
            onPress={incomingcall}
          >
            <Text>test incoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{height: 60, width: 60, justifyContent: "center",}}
            onPress={()=> {}}
          >
            <Text>test zoom</Text>
          </TouchableOpacity>
        </View>
        {
          zoom ? (
            <ZoomVideoSdkProvider config={{ appGroupId: "test", domain: "zoom.us", enableLog: true }}>
              <SafeAreaView style={styles.safe}>
                <Call />
              </SafeAreaView>
            </ZoomVideoSdkProvider>
          ) : null
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const Call = () => {
  const zoom = useZoom();
  const listeners = useRef<EmitterSubscription[]>([]);
  const [users, setUsersInSession] = useState<ZoomVideoSdkUser[]>([]);
  const [isInSession, setIsInSession] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const join = async () => {
    /* Disclaimer: JWT should be generated from your server */

    const sessionLeave = zoom.addListener(EventType.onSessionLeave, () => {
      setIsInSession(false);
      setUsersInSession([]);
      sessionLeave.remove();
    });

    await zoom
      .joinSession({
        sessionName: 'config.sessionName',
        sessionPassword: 'config.sessionPassword',
        token: 'token',
        userName: 'uname',
        audioOptions: { connect: true, mute: true, autoAdjustSpeakerVolume: false },
        videoOptions: { localVideoOn: true },
        sessionIdleTimeoutMins: 10,
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const leaveSession = () => {
    zoom.leaveSession(false);
    setIsInSession(false);
    listeners.current.forEach((listener) => listener.remove());
    listeners.current = [];
  };

  return (
    <View style={styles.container}>
      {users.map((user) => (
        <View style={styles.container} key={user.userId}>
          <ZoomView
            style={styles.container}
            userId={user.userId}
            fullScreen
            videoAspect={VideoAspect.PanAndScan}
          />
        </View>
      ))}
      <MuteButtons isAudioMuted={isAudioMuted} isVideoMuted={isVideoMuted} />
      <Button title="Leave Session" color={"#f01040"} onPress={leaveSession} />
    </View>
  )
};

const MuteButtons = ({ isAudioMuted, isVideoMuted }: { isAudioMuted: boolean; isVideoMuted: boolean }) => {
  const zoom = useZoom();
  const onPressAudio = async () => {
    const mySelf = await zoom.session.getMySelf();
    const muted = await mySelf.audioStatus.isMuted();
    muted
      ? await zoom.audioHelper.unmuteAudio(mySelf.userId)
      : await zoom.audioHelper.muteAudio(mySelf.userId);
  };

  const onPressVideo = async () => {
    const mySelf = await zoom.session.getMySelf();
    const videoOn = await mySelf.videoStatus.isOn();
    videoOn ? await zoom.videoHelper.stopVideo() : await zoom.videoHelper.startVideo();
  };
  return (
    <View style={styles.buttonHolder}>
      <Button title={isAudioMuted ? "Unmute Audio" : "Mute Audio"} onPress={onPressAudio} />
      <View style={styles.spacer} />
      <Button title={isVideoMuted ? "Unmute Video" : "Mute Video"} onPress={onPressVideo} />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  safe: {
    width: '90%',
    alignSelf: 'center',
    margin: 16,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    alignSelf: 'center',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    height: 16,
    width: 8,
  },
  buttonHolder: {
    flexDirection: "row",
    justifyContent: "center",
    margin: 8
  },
});

export default App;
