#import "AppDelegate.h"
#import "RNCallKeep.h" // This line need to be after PushKit
#import <PushKit/PushKit.h> // This line need to be after PushKit
#import <React/RCTRootView.h> // This line need to be after PushKit
#import "RNVoipPushNotificationManager.h" // This line need to be after PushKit
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [RNVoipPushNotificationManager voipRegistration];
  self.moduleName = @"test";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  [RNCallKeep setup:@{
    @"appName": @"Awesome App",
    @"maximumCallGroups": @3,
    @"maximumCallsPerCallGroup": @1,
    @"supportsVideo": @NO,
  }];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:@"test" initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];


  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type
{
  // --- The system calls this method when a previously provided push token is no longer valid for use. No action is necessary on your part to reregister the push type. Instead, use this method to notify your server not to send push notifications using the matching push token.
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  // Process the received push
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // Retrieve information like handle and callerName here
  NSString *uuid = payload.dictionaryPayload[@"custom"][@"a"][@"uuid"];
  NSString *callerName =  payload.dictionaryPayload[@"custom"][@"a"][@"callerName"];
  NSString *handle = payload.dictionaryPayload[@"custom"][@"a"][@"callerPhone"];
  NSMutableDictionary *extra = payload.dictionaryPayload[@"custom"][@"a"];
  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  [RNCallKeep reportNewIncomingCall: uuid
                             handle: handle
                         handleType: @"generic"
                           hasVideo: NO
                localizedCallerName: callerName
                    supportsHolding: YES
                       supportsDTMF: YES
                   supportsGrouping: YES
                 supportsUngrouping: YES
                        fromPushKit: YES
                            payload: extra
              withCompletionHandler: completion];
              completion();
}

@end
