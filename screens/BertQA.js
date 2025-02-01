import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTransactionInfo } from 'transaction-sms-parser/dist/lib';

import React, {useRef, useState} from 'react';

import {Colors} from '../utils/colors';
import {StyleSheet} from 'react-native';
import {askBert} from '../utils/BertQAHelper';

const ContextContainer = ({context = '', setContext = text => {}}) => {
  const contextRef = useRef(null);
  return (
    <View style={{flex: 1}}>
      <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
        <Text style={styles.header}>Context</Text>
      </View>
      <View style={styles.contextContainer}>
        <TextInput
          ref={contextRef}
          placeholder="Please provide context!"
          value={context}
          onChangeText={text => setContext(text)}
          style={styles.text}
          multiline
          editable={true}
          autoCapitalize="sentences"
        />
      </View>
    </View>
  );
};

const predefinedQuestions = [
  "How much amount was transferred?",
  "What is the account type?",
  "What is the account number?",
  "What is the account name?",
  "What is the available balance?",
  "What is the outstanding balance?",
  "What is the transaction type?",
  "What is the reference number?",
  "Who is the merchant?"
];

const getTransactionDetails = (context) => {
  const transactionInfo = getTransactionInfo(context);
  return {
    "How much amount was transferred?": transactionInfo.transaction.amount || 'N/A',
    "What is the account type?": transactionInfo.account.type || 'N/A',
    "What is the account number?": transactionInfo.account.number || 'N/A',
    "What is the account name?": transactionInfo.account.name || 'N/A',
    "What is the available balance?": transactionInfo.balance?.available || 'N/A',
    "What is the outstanding balance?": transactionInfo.balance?.outstanding || 'N/A',
    "What is the transaction type?": transactionInfo.transaction.type || 'N/A',
    "What is the reference number?": transactionInfo.transaction.referenceNo || 'N/A',
    "Who is the merchant?": transactionInfo.transaction.merchant || 'N/A'
  };
};

const MessageInput = ({
  question = '',
  context = '',
  setQuestion = text => {},
  setAnswer,
}) => {
  const [inputHeight, setInputHeight] = useState(50);
  const [loading, setLoading] = useState(false);
  const disableInput = question.trim() === '' || context === '';
  const maxInputHeight = 100;

  const getAnswerFromContext = async () => {
    try {
      setLoading(true);
      const res = await askBert(context, question);
      const answers = res.map((answer, index) => `${index + 1}. ${answer.text}`).join('\n') || 'Unable to find an answer!';
      const transactionDetails = getTransactionDetails(context)[question];

      setTimeout(() => {
        setAnswer({
          bertAnswer: answers,
          regexSolution: transactionDetails
        });
        setLoading(false);
        setQuestion('');
      }, 700);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSendPress = () => {
    getAnswerFromContext();
    if (question.trim() !== '') {
      Keyboard.dismiss();
      setInputHeight(50);
    }
  };

  const handleContentSizeChange = (contentWidth, contentHeight) => {
    // Limit the input container height to a maximum of 4 lines
    setInputHeight(Math.min(maxInputHeight, Math.max(50, contentHeight)));
  };

  return (
    <View style={[styles.textContainer, {height: inputHeight}]}>
      <TextInput
        style={[styles.input, {minHeight: inputHeight}]}
        placeholder="Type your query..."
        value={question}
        onChangeText={text => setQuestion(text)}
        onContentSizeChange={e =>
          handleContentSizeChange(
            e.nativeEvent.contentSize.width,
            e.nativeEvent.contentSize.height,
          )
        }
        multiline
        autoCapitalize="sentences"
        maxHeight={maxInputHeight}
      />
      {!loading ? (
        <TouchableOpacity onPress={handleSendPress} disabled={disableInput}>
          <Icon
            name="send"
            size={24}
            color="white"
            style={disableInput ? styles.disabled : styles.active}
          />
        </TouchableOpacity>
      ) : (
        <ActivityIndicator size="small" color="white" />
      )}
    </View>
  );
};

const BertQA = ({navigation}) => {
  const [context, setContext] = useState(`Sent Rs.80.00
From HDFC Bank A/C x0060
To THE MILLET CAFE
On 22/01/25
Ref 502230438643
Not You?
Call 18002586161/SMS BLOCK UPI to 7308080808`);
  const [answers, setAnswers] = useState(predefinedQuestions.map(() => ''));
  const [lastAnswer, setLastAnswer] = useState({ bertAnswer: '', regexSolution: '' });

  const setAnswerAtIndex = (index, answer) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
    setLastAnswer(answer);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.mainContainer}
      keyboardShouldPersistTaps="always">
      <ContextContainer context={context} setContext={setContext} />
      {predefinedQuestions.map((question, index) => (
        <MessageInput
          key={index}
          question={question}
          context={context}
          setQuestion={() => {}}
          setAnswer={(answer) => setAnswerAtIndex(index, answer)}
        />
      ))}
      <View style={styles.answerContainer}>
        <View style={styles.answerBlock}>
          <Text style={styles.answerHeader}>Question:</Text>
          <Text style={styles.questionText}>{predefinedQuestions[answers.indexOf(lastAnswer)]}</Text>
          <Text style={styles.answerHeader}>BERT Answer:</Text>
          <Text style={styles.answerText}>{lastAnswer.bertAnswer}</Text>
          <Text style={styles.answerHeader}>Regex Solution:</Text>
          <Text style={styles.answerText}>{lastAnswer.regexSolution}</Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 15,
    backgroundColor: Colors.backgroundColor,
  },
  contextContainer: {
    flex: 0.8,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    padding: 5,
    width: '100%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'gray',
  },
  textContainer: {
    flexDirection: 'row',
    flex: 0.1,
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
    borderColor: 'gray',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  text: {
    color: 'white',
  },
  buttonContainer: {
    borderColor: 'white',
    borderWidth: 1,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 5,
  },
  iconPadding: {
    paddingRight: 4,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    textTransform: 'capitalize',
  },
  disabled: {
    opacity: 0.4,
  },
  active: {
    opacity: 1,
  },
  answerContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  answerBlock: {
    marginBottom: 10,
  },
  answerHeader: {
    fontWeight: 'bold',
    color: 'black',
  },
  questionText: {
    fontStyle: 'italic',
    color: 'black',
    marginBottom: 5,
  },
  answerText: {
    color: 'black',
    marginBottom: 10,
  },
});

export default BertQA;
