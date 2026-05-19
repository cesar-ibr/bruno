import {
  Update,
  UpdateType,
  WebhookInfo,
  User,
  Chat,
  ChatType,
  Message,
  MessageSubType,
  MessageEntity,
  MessageEntityType,
  PhotoSize,
  Animation,
  Audio,
  Document,
  Video,
  VideoNote,
  Voice,
  Contact,
  Dice,
  PollOption,
  PollAnswer,
  Poll,
  PollType,
  Location,
  Venue,
  UserProfilePhotos,
  File,
  ReplyMarkup,
  ReplyKeyboardMarkup,
  KeyboardButton,
  KeyboardButtonPollType,
  ReplyKeyboardRemove,
  InlineKeyboardMarkup,
  InlineKeyboardButton,
  LoginUrl,
  CallbackQuery,
  ForceReply,
  ChatPhoto,
  ChatPermissions,
  BotCommand,
  ResponseParameters,
  InputMedia,
  InputMediaPhoto,
  InputMediaVideo,
  InputMediaAnimation,
  InputMediaAudio,
  InputMediaDocument,
  InputFile,
  Sticker,
  MaskPosition,
  InlineQuery,
  ChosenInlineResult,
  Invoice,
  OrderInfo,
  ShippingAddress,
  SuccessfulPayment,
  ShippingQuery,
  PreCheckoutQuery,
  PassportData,
  Game,
  CallbackGame,
  GameHighScore,
  GetUpdatesParameters,
  SetWebhookParameters,
  ParseMode,
  SendMessageParameters,
  ForwardMessageParameters,
  SendPhotoParameters,
  SendAudioParameters,
  SendDocumentParameters,
  SendVideoParameters,
  SendAnimationParameters,
  SendVideoNoteParameters,
  KickChatMemberParameters,
  AnswerCallbackQueryParameters,
} from './telegram';

describe('Telegram Types', () => {
  // Test UpdateType union type
  describe('UpdateType', () => {
    it('should have all expected values', () => {
      const expectedValues: UpdateType[] = [
        'message',
        'edited_message',
        'channel_post',
        'edited_channel_post',
        'inline_query',
        'chosen_inline_result',
        'callback_query',
        'shipping_query',
        'pre_checkout_query',
        'poll',
        'poll_answer'
      ];
      expect(expectedValues).toHaveLength(11);
    });
  });

  // Test ChatType union type
  describe('ChatType', () => {
    it('should have all expected values', () => {
      const expectedValues: ChatType[] = [
        'private',
        'group',
        'supergroup',
        'channel'
      ];
      expect(expectedValues).toHaveLength(4);
    });
  });

  // Test MessageSubType union type
  describe('MessageSubType', () => {
    it('should have all expected values', () => {
      const expectedValues: MessageSubType[] = [
        'text',
        'animation',
        'audio',
        'document',
        'photo',
        'sticker',
        'video',
        'video_note',
        'voice',
        'contact',
        'dice',
        'game',
        'poll',
        'venue',
        'location',
        'new_chat_members',
        'left_chat_member',
        'new_chat_title',
        'new_chat_photo',
        'delete_chat_photo',
        'group_chat_created',
        'supergroup_chat_created',
        'channel_chat_created',
        'migrate_to_chat_id',
        'migrate_from_chat_id',
        'pinned_message',
        'invoice',
        'successful_payment',
        'connected_website',
        'passport_data',
        'forward_date'
      ];
      expect(expectedValues).toHaveLength(31);
    });
  });

  // Test MessageEntityType union type
  describe('MessageEntityType', () => {
    it('should have all expected values', () => {
      const expectedValues: MessageEntityType[] = [
        'mention',
        'hashtag',
        'cashtag',
        'bot_command',
        'url',
        'email',
        'phone_number',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
        'pre',
        'text_link',
        'text_mention'
      ];
      expect(expectedValues).toHaveLength(15);
    });
  });

  // Test PollType union type
  describe('PollType', () => {
    it('should have all expected values', () => {
      const expectedValues: PollType[] = [
        'regular',
        'quiz'
      ];
      expect(expectedValues).toHaveLength(2);
    });
  });

  // Test ParseMode union type
  describe('ParseMode', () => {
    it('should have all expected values', () => {
      const expectedValues: ParseMode[] = [
        'MarkdownV2',
        'HTML',
        'Markdown'
      ];
      expect(expectedValues).toHaveLength(3);
    });
  });

  // Test Update interface
  describe('Update', () => {
    it('should match the expected structure', () => {
      const update: Update = {
        update_id: 123456,
        message: {
          message_id: 1,
          date: 1234567890,
          chat: {
            id: 123456789,
            type: 'private',
            first_name: 'Test User'
          }
        }
      };
      expect(update.update_id).toBe(123456);
      expect(update.message?.message_id).toBe(1);
    });
  });

  // Test WebhookInfo interface
  describe('WebhookInfo', () => {
    it('should match the expected structure', () => {
      const webhookInfo: WebhookInfo = {
        url: 'https://example.com/webhook',
        has_custom_certificate: false,
        pending_update_count: 0,
      };
      expect(webhookInfo.url).toBe('https://example.com/webhook');
      expect(webhookInfo.has_custom_certificate).toBe(false);
      expect(webhookInfo.pending_update_count).toBe(0);
    });
  });

  // Test User interface
  describe('User', () => {
    it('should match the expected structure', () => {
      const user: User = {
        id: 123456789,
        is_bot: false,
        first_name: 'Test User',
        username: 'testuser',
        language_code: 'en'
      };
      expect(user.id).toBe(123456789);
      expect(user.is_bot).toBe(false);
      expect(user.first_name).toBe('Test User');
    });
  });

  // Test Chat interface
  describe('Chat', () => {
    it('should match the expected structure', () => {
      const chat: Chat = {
        id: 123456789,
        type: 'private',
        first_name: 'Test User',
        username: 'testuser'
      };
      expect(chat.id).toBe(123456789);
      expect(chat.type).toBe('private');
    });
  });

  // Test Message interface
  describe('Message', () => {
    it('should match the expected structure', () => {
      const message: Message = {
        message_id: 1,
        date: 1234567890,
        chat: {
          id: 123456789,
          type: 'private',
          first_name: 'Test User'
        }
      };
      expect(message.message_id).toBe(1);
      expect(message.date).toBe(1234567890);
      expect(message.chat.id).toBe(123456789);
    });
  });

  // Test MessageEntity interface
  describe('MessageEntity', () => {
    it('should match the expected structure', () => {
      const entity: MessageEntity = {
        type: 'bold',
        offset: 0,
        length: 5
      };
      expect(entity.type).toBe('bold');
      expect(entity.offset).toBe(0);
      expect(entity.length).toBe(5);
    });
  });

  // Test PhotoSize interface
  describe('PhotoSize', () => {
    it('should match the expected structure', () => {
      const photoSize: PhotoSize = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        width: 100,
        height: 100
      };
      expect(photoSize.file_id).toBe('some_file_id');
      expect(photoSize.width).toBe(100);
      expect(photoSize.height).toBe(100);
    });
  });

  // Test Animation interface
  describe('Animation', () => {
    it('should match the expected structure', () => {
      const animation: Animation = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        width: 100,
        height: 100,
        duration: 10,
        thumb: {
          file_id: 'thumb_file_id',
          file_unique_id: 'thumb_unique_id',
          width: 90,
          height: 90
        },
        file_name: 'animation.gif',
        mime_type: 'image/gif',
        file_size: 1024
      };
      expect(animation.file_id).toBe('some_file_id');
      expect(animation.duration).toBe(10);
      expect(animation.file_name).toBe('animation.gif');
    });
  });

  // Test Audio interface
  describe('Audio', () => {
    it('should match the expected structure', () => {
      const audio: Audio = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        duration: 180,
        performer: 'Artist Name',
        title: 'Song Title',
        mime_type: 'audio/mpeg',
        file_size: 2048000
      };
      expect(audio.file_id).toBe('some_file_id');
      expect(audio.duration).toBe(180);
    });
  });

  // Test Document interface
  describe('Document', () => {
    it('should match the expected structure', () => {
      const document: Document = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        file_name: 'document.pdf',
        mime_type: 'application/pdf',
        file_size: 512000
      };
      expect(document.file_id).toBe('some_file_id');
      expect(document.file_name).toBe('document.pdf');
    });
  });

  // Test Video interface
  describe('Video', () => {
    it('should match the expected structure', () => {
      const video: Video = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        width: 1920,
        height: 1080,
        duration: 120,
        mime_type: 'video/mp4',
        file_size: 10485760
      };
      expect(video.file_id).toBe('some_file_id');
      expect(video.width).toBe(1920);
    });
  });

  // Test VideoNote interface
  describe('VideoNote', () => {
    it('should match the expected structure', () => {
      const videoNote: VideoNote = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        length: 240,
        duration: 60,
        file_size: 2097152
      };
      expect(videoNote.file_id).toBe('some_file_id');
      expect(videoNote.length).toBe(240);
      expect(videoNote.duration).toBe(60);
    });
  });

  // Test Voice interface
  describe('Voice', () => {
    it('should match the expected structure', () => {
      const voice: Voice = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        duration: 30,
        mime_type: 'audio/ogg',
        file_size: 102400
      };
      expect(voice.file_id).toBe('some_file_id');
      expect(voice.duration).toBe(30);
    });
  });

  // Test Contact interface
  describe('Contact', () => {
    it('should match the expected structure', () => {
      const contact: Contact = {
        phone_number: 1234567890,
        first_name: 'John',
        last_name: 'Doe',
        user_id: 987654321
      };
      expect(contact.phone_number).toBe(1234567890);
      expect(contact.first_name).toBe('John');
    });
  });

  // Test Dice interface
  describe('Dice', () => {
    it('should match the expected structure', () => {
      const dice: Dice = {
        emoji: '🎲',
        value: 5
      };
      expect(dice.emoji).toBe('🎲');
      expect(dice.value).toBe(5);
    });
  });

  // Test PollOption interface
  describe('PollOption', () => {
    it('should match the expected structure', () => {
      const pollOption: PollOption = {
        text: 'Option 1',
        voter_count: 10
      };
      expect(pollOption.text).toBe('Option 1');
      expect(pollOption.voter_count).toBe(10);
    });
  });

  // Test PollAnswer interface
  describe('PollAnswer', () => {
    it('should match the expected structure', () => {
      const pollAnswer: PollAnswer = {
        poll_id: 'poll_123',
        user: {
          id: 123456789,
          is_bot: false,
          first_name: 'Test User'
        },
        option_ids: [0, 1]
      };
      expect(pollAnswer.poll_id).toBe('poll_123');
      expect(pollAnswer.option_ids).toEqual([0, 1]);
    });
  });

  // Test Poll interface
  describe('Poll', () => {
    it('should match the expected structure', () => {
      const poll: Poll = {
        id: 'poll_123',
        question: 'What is your favorite color?',
        options: [
          { text: 'Red', voter_count: 5 },
          { text: 'Blue', voter_count: 10 }
        ],
        total_voter_count: 15,
        is_closed: false,
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      };
      expect(poll.question).toBe('What is your favorite color?');
      expect(poll.options).toHaveLength(2);
    });
  });

  // Test Location interface
  describe('Location', () => {
    it('should match the expected structure', () => {
      const location: Location = {
        longitude: 12.34,
        latitude: 56.78
      };
      expect(location.longitude).toBe(12.34);
      expect(location.latitude).toBe(56.78);
    });
  });

  // Test Venue interface
  describe('Venue', () => {
    it('should match the expected structure', () => {
      const venue: Venue = {
        location: {
          longitude: 12.34,
          latitude: 56.78
        },
        title: 'Test Venue',
        address: '123 Main St'
      };
      expect(venue.title).toBe('Test Venue');
      expect(venue.address).toBe('123 Main St');
    });
  });

  // Test UserProfilePhotos interface
  describe('UserProfilePhotos', () => {
    it('should match the expected structure', () => {
      const userProfilePhotos: UserProfilePhotos = {
        total_count: 1,
        photos: [[{
          file_id: 'photo_file_id',
          file_unique_id: 'photo_unique_id',
          width: 160,
          height: 160
        }]]
      };
      expect(userProfilePhotos.total_count).toBe(1);
      expect(userProfilePhotos.photos).toHaveLength(1);
    });
  });

  // Test File interface
  describe('File', () => {
    it('should match the expected structure', () => {
      const file: File = {
        file_id: 'some_file_id',
        file_unique_id: 'some_unique_id',
        file_size: 1024,
        file_path: 'photos/file_1.jpg'
      };
      expect(file.file_id).toBe('some_file_id');
      expect(file.file_size).toBe(1024);
    });
  });

  // Test ReplyKeyboardMarkup interface
  describe('ReplyKeyboardMarkup', () => {
    it('should match the expected structure', () => {
      const replyKeyboardMarkup: ReplyKeyboardMarkup = {
        keyboard: [[{
          text: 'Button 1'
        }, {
          text: 'Button 2'
        }]],
        resize_keyboard: true,
        one_time_keyboard: true
      };
      expect(replyKeyboardMarkup.keyboard).toHaveLength(1);
    });
  });

  // Test KeyboardButton interface
  describe('KeyboardButton', () => {
    it('should match the expected structure', () => {
      const keyboardButton: KeyboardButton = {
        text: 'Click Me',
        request_contact: true
      };
      expect(keyboardButton.text).toBe('Click Me');
      expect(keyboardButton.request_contact).toBe(true);
    });
  });

  // Test LoginUrl interface
  describe('LoginUrl', () => {
    it('should match the expected structure', () => {
      const loginUrl: LoginUrl = {
        url: 'https://example.com/login',
        forward_text: 'Forward text',
        bot_username: 'test_bot',
        request_write_access: true
      };
      expect(loginUrl.url).toBe('https://example.com/login');
    });
  });

  // Test CallbackQuery interface
  describe('CallbackQuery', () => {
    it('should match the expected structure', () => {
      const callbackQuery: CallbackQuery = {
        id: 'callback_123',
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Test User'
        },
        chat_instance: 'chat_instance_123',
        data: 'button_pressed'
      };
      expect(callbackQuery.id).toBe('callback_123');
      expect(callbackQuery.data).toBe('button_pressed');
    });
  });

  // Test ChatPhoto interface
  describe('ChatPhoto', () => {
    it('should match the expected structure', () => {
      const chatPhoto: ChatPhoto = {
        small_file_id: 'small_file_id',
        small_file_unique_id: 'small_unique_id',
        big_file_id: 'big_file_id',
        big_file_unique_id: 'big_unique_id'
      };
      expect(chatPhoto.small_file_id).toBe('small_file_id');
    });
  });

  // Test ChatPermissions interface
  describe('ChatPermissions', () => {
    it('should match the expected structure', () => {
      const chatPermissions: ChatPermissions = {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false
      };
      expect(chatPermissions.can_send_messages).toBe(true);
      expect(chatPermissions.can_change_info).toBe(false);
    });
  });

  // Test BotCommand interface
  describe('BotCommand', () => {
    it('should match the expected structure', () => {
      const botCommand: BotCommand = {
        command: 'start',
        description: 'Start the bot'
      };
      expect(botCommand.command).toBe('start');
      expect(botCommand.description).toBe('Start the bot');
    });
  });

  // Test InputMedia types
  describe('InputMedia types', () => {
    it('should match InputMediaPhoto structure', () => {
      const photo: InputMediaPhoto = {
        type: 'photo',
        media: 'file_id_or_url',
        caption: 'A beautiful photo'
      };
      expect(photo.type).toBe('photo');
      expect(photo.media).toBe('file_id_or_url');
    });

    it('should match InputMediaVideo structure', () => {
      const video: InputMediaVideo = {
        type: 'video',
        media: 'file_id_or_url',
        caption: 'A cool video',
        width: 1920,
        height: 1080,
        duration: 60,
        supports_streaming: true
      };
      expect(video.type).toBe('video');
      expect(video.width).toBe(1920);
    });

    it('should match InputMediaAnimation structure', () => {
      const animation: InputMediaAnimation = {
        type: 'animation',
        media: 'file_id_or_url',
        caption: 'An animated GIF'
      };
      expect(animation.type).toBe('animation');
    });

    it('should match InputMediaAudio structure', () => {
      const audio: InputMediaAudio = {
        type: 'audio',
        media: 'file_id_or_url',
        caption: 'A nice song'
      };
      expect(audio.type).toBe('audio');
    });

    it('should match InputMediaDocument structure', () => {
      const document: InputMediaDocument = {
        type: 'document',
        media: 'file_id_or_url',
        caption: 'An important document'
      };
      expect(document.type).toBe('document');
    });

    it('should allow InputMedia to accept any of the input media types', () => {
      const mediaPhoto: InputMedia = {
        type: 'photo',
        media: 'file_id_or_url'
      };
      
      const mediaVideo: InputMedia = {
        type: 'video',
        media: 'file_id_or_url'
      };
      
      expect(mediaPhoto.type).toBe('photo');
      expect(mediaVideo.type).toBe('video');
    });
  });

  // Test Sticker interface
  describe('Sticker', () => {
    it('should match the expected structure', () => {
      const sticker: Sticker = {
        file_id: 'sticker_file_id',
        file_unique_id: 'sticker_unique_id',
        width: 512,
        height: 512,
        is_animated: false,
        emoji: '😀',
        file_size: 20480
      };
      expect(sticker.file_id).toBe('sticker_file_id');
      expect(sticker.is_animated).toBe(false);
    });
  });

  // Test MaskPosition interface
  describe('MaskPosition', () => {
    it('should match the expected structure', () => {
      const maskPosition: MaskPosition = {
        point: 'forehead',
        x_shift: 0.5,
        y_shift: 0.5,
        scale: 1.0
      };
      expect(maskPosition.point).toBe('forehead');
    });
  });

  // Test InlineQuery interface
  describe('InlineQuery', () => {
    it('should match the expected structure', () => {
      const inlineQuery: InlineQuery = {
        id: 'inline_query_id',
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Test User'
        },
        query: 'search query',
        offset: '0'
      };
      expect(inlineQuery.id).toBe('inline_query_id');
      expect(inlineQuery.query).toBe('search query');
    });
  });

  // Test ChosenInlineResult interface
  describe('ChosenInlineResult', () => {
    it('should match the expected structure', () => {
      const chosenResult: ChosenInlineResult = {
        result_id: 'result_123',
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Test User'
        },
        query: 'user query'
      };
      expect(chosenResult.result_id).toBe('result_123');
    });
  });

  // Test Invoice interface
  describe('Invoice', () => {
    it('should match the expected structure', () => {
      const invoice: Invoice = {
        title: 'Product Title',
        description: 'Product Description',
        start_parameter: 'start_param',
        currency: 'USD',
        total_amount: 1000
      };
      expect(invoice.title).toBe('Product Title');
      expect(invoice.total_amount).toBe(1000);
    });
  });

  // Test ShippingAddress interface
  describe('ShippingAddress', () => {
    it('should match the expected structure', () => {
      const shippingAddress: ShippingAddress = {
        country_code: 'US',
        state: 'CA',
        city: 'San Francisco',
        street_line1: '123 Main St',
        street_line2: 'Apt 4',
        post_code: '94105'
      };
      expect(shippingAddress.country_code).toBe('US');
      expect(shippingAddress.city).toBe('San Francisco');
    });
  });

  // Test SuccessfulPayment interface
  describe('SuccessfulPayment', () => {
    it('should match the expected structure', () => {
      const payment: SuccessfulPayment = {
        currency: 'USD',
        total_amount: 1000,
        invoice_payload: 'payload_data',
        telegram_payment_charge_id: 'charge_123',
        provider_payment_charge_id: 'provider_charge_456'
      };
      expect(payment.currency).toBe('USD');
      expect(payment.total_amount).toBe(1000);
    });
  });

  // Test ShippingQuery interface
  describe('ShippingQuery', () => {
    it('should match the expected structure', () => {
      const shippingQuery: ShippingQuery = {
        id: 'shipping_query_id',
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Customer'
        },
        invoice_payload: 'payload_data',
        shipping_address: {
          country_code: 'US',
          state: 'CA',
          city: 'San Francisco',
          street_line1: '123 Main St',
          street_line2: '',
          post_code: '94105'
        }
      };
      expect(shippingQuery.id).toBe('shipping_query_id');
    });
  });

  // Test PreCheckoutQuery interface
  describe('PreCheckoutQuery', () => {
    it('should match the expected structure', () => {
      const preCheckoutQuery: PreCheckoutQuery = {
        id: 'pre_checkout_id',
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'Customer'
        },
        currency: 'USD',
        total_amount: 1000,
        invoice_payload: 'payload_data',
        shipping_option_id: 'option_1',
        order_info: {
          name: 'John Doe',
          phone_number: '1234567890',
          email: 'john@example.com',
          shipping_address: {
            country_code: 'US',
            state: 'CA',
            city: 'San Francisco',
            street_line1: '123 Main St',
            street_line2: '',
            post_code: '94105'
          }
        }
      };
      expect(preCheckoutQuery.id).toBe('pre_checkout_id');
      expect(preCheckoutQuery.total_amount).toBe(1000);
    });
  });

  // Test Game interface
  describe('Game', () => {
    it('should match the expected structure', () => {
      const game: Game = {
        title: 'Test Game',
        description: 'Game Description',
        photo: [{
          file_id: 'photo_file_id',
          file_unique_id: 'photo_unique_id',
          width: 100,
          height: 100
        }]
      };
      expect(game.title).toBe('Test Game');
    });
  });

  // Test GameHighScore interface
  describe('GameHighScore', () => {
    it('should match the expected structure', () => {
      const highScore: GameHighScore = {
        position: 1,
        user: {
          id: 123456789,
          is_bot: false,
          first_name: 'Player'
        },
        score: 1000
      };
      expect(highScore.position).toBe(1);
      expect(highScore.score).toBe(1000);
    });
  });

  // Test API Parameter interfaces
  describe('API Parameter Interfaces', () => {
    it('should match GetUpdatesParameters structure', () => {
      const params: GetUpdatesParameters = {
        offset: 0,
        limit: 100,
        timeout: 0,
        allowed_updates: []
      };
      expect(params.offset).toBe(0);
      expect(params.limit).toBe(100);
    });

    it('should match SetWebhookParameters structure', () => {
      const params: SetWebhookParameters = {
        url: 'https://example.com/webhook',
        max_connections: 40
      };
      expect(params.url).toBe('https://example.com/webhook');
    });

    it('should match SendMessageParameters structure', () => {
      const params: SendMessageParameters = {
        chat_id: 123456789,
        text: 'Hello, world!',
        parse_mode: 'MarkdownV2',
        disable_notification: false
      };
      expect(params.text).toBe('Hello, world!');
    });

    it('should match ForwardMessageParameters structure', () => {
      const params: ForwardMessageParameters = {
        chat_id: 123456789,
        from_chat_id: 987654321,
        message_id: 123
      };
      expect(params.message_id).toBe(123);
    });

    it('should match SendPhotoParameters structure', () => {
      const params: SendPhotoParameters = {
        chat_id: 123456789,
        photo: 'file_id',
        caption: 'A photo caption'
      };
      expect(params.photo).toBe('file_id');
    });

    it('should match SendAudioParameters structure', () => {
      const params: SendAudioParameters = {
        chat_id: 123456789,
        voice: 'file_id',
        duration: 60
      };
      expect(params.voice).toBe('file_id');
    });

    it('should match SendVideoParameters structure', () => {
      const params: SendVideoParameters = {
        chat_id: 123456789,
        video: 'file_id',
        duration: 120
      };
      expect(params.video).toBe('file_id');
    });

    it('should match SendAnimationParameters structure', () => {
      const params: SendAnimationParameters = {
        chat_id: 123456789,
        animation: 'file_id',
        duration: 30
      };
      expect(params.animation).toBe('file_id');
    });

    it('should match SendVideoNoteParameters structure', () => {
      const params: SendVideoNoteParameters = {
        chat_id: 123456789,
        video_note: 'file_id',
        length: 240
      };
      expect(params.video_note).toBe('file_id');
    });

    it('should match KickChatMemberParameters structure', () => {
      const params: KickChatMemberParameters = {
        chat_id: 123456789,
        user_id: 987654321,
        until_date: 1234567890
      };
      expect(params.until_date).toBe(1234567890);
    });

    it('should match AnswerCallbackQueryParameters structure', () => {
      const params: AnswerCallbackQueryParameters = {
        callback_query_id: 'query_123',
        text: 'Response text',
        show_alert: false
      };
      expect(params.callback_query_id).toBe('query_123');
    });
  });

  // Test type aliases
  describe('Type Aliases', () => {
    it('should handle InputFile as unknown type', () => {
      const inputFile: InputFile = undefined;
      expect(inputFile).toBeUndefined();
    });

    it('should handle PassportData as unknown type', () => {
      const passportData: PassportData = null;
      expect(passportData).toBeNull();
    });

    it('should handle CallbackGame as unknown type', () => {
      const callbackGame: CallbackGame = undefined;
      expect(callbackGame).toBeUndefined();
    });

    it('should handle ReplyMarkup union type correctly', () => {
      const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [[{
          text: 'Button',
          callback_data: 'click'
        }]]
      };
      
      const replyKeyboard: ReplyKeyboardMarkup = {
        keyboard: [[{
          text: 'Button'
        }]]
      };
      
      const replyMarkup: ReplyMarkup = inlineKeyboard;
      expect((replyMarkup as InlineKeyboardMarkup).inline_keyboard).toBeDefined();
    });
  });
});