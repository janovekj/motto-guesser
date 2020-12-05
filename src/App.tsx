import React, { useEffect, useReducer, useRef } from 'react';
import styled from 'styled-components';
import { countries } from './data';
const filteredCountries = countries.filter((c) => {
  const motto = c.motto.toLowerCase();
  return !motto.startsWith('no official') || motto.includes('currently none');
});

const Scoreboard = styled.div`
  display: flex;
  span:not(:first-of-type) {
    margin-left: 4px;
  }
`;

const Options = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  button:disabled {
    &[data-is-guess='true'] {
      &[data-is-correct='true'] {
        outline: 2px solid #86ea86;
        background: #d2ffd2;
        color: #005700;
      }

      &[data-is-correct='false'] {
        outline: 2px solid #ff8d8d;
        background: #ffdee4;
        color: #ff3a3a;
      }
    }
  }

  > *:not(:first-child) {
    margin-left: 16px;
  }
`;

const Results = styled.div`
  p {
    font-size: 18px;
  }

  button {
    margin-top: 16px;
  }
`;

const PostGameOptions = styled.div`
  button:not(:first-of-type) {
    margin-left: 16px;
  }

  button:disabled {
    opacity: 0.5;
  }
`;

const PostGame = styled.div`
  ${PostGameOptions} {
    margin-top: 24px;
  }
`;

const AppWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-family: 'Verdana';
  text-align: center;

  * {
    box-sizing: border-box;
  }

  button:hover {
    transform: scale(1.05);
  }

  button,
  button:disabled {
    color: #333;
    background: #efefef;
    border: none;
    padding: 16px 32px;
    font-size: 18px;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  h1 {
    margin-bottom: 40px;
  }

  h2 {
    margin: 40px 0;
  }

  q {
    display: block;
    padding: 40px;
    font-size: 26px;
    background: #fafafa;
    width: 100%;
  }

  ${Options} {
    margin-top: 16px;
  }

  ${Results} {
    margin-top: 32px;
  }

  ${PostGame} {
    margin-top: 32px;
  }
`;

function shuffle<T>(list: T[]) {
  const copy = [...list];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(list: T[], count: number) {
  const shuffled = shuffle(list);

  return shuffled.slice(0, count);
}

const createQuestions = (count: number) => {
  const correctCountries = pickRandom(filteredCountries, count);
  const incorrectCountries = pickRandom(filteredCountries, count);

  const questions: Question[] = correctCountries.map((country, index) => {
    const isA = Math.random() < 0.5;

    return {
      motto: country.motto,
      a: isA ? country.name : incorrectCountries[index].name,
      b: isA ? incorrectCountries[index].name : country.name,
      correct: isA ? 'a' : 'b',
    };
  });

  return questions;
};

interface Question {
  motto: string;
  a: string;
  b: string;
  correct: 'a' | 'b';
}

interface CommonState {
  questions: Question[];
  results: boolean[];
}

type QuizState = (
  | {
      state: 'guessing';
    }
  | {
      state: 'result';
    }
  | {
      state: 'finished';
    }
) &
  CommonState;

type QuizAction =
  | {
      type: 'guess';
      guess: 'a' | 'b';
    }
  | {
      type: 'continue';
    }
  | { type: 'restart' };

const getCurrentQuestionIndex = (state: QuizState) => state.results.length;

const hasMoreQuestions = (state: QuizState) =>
  state.results.length < state.questions.length;

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (state.state) {
    case 'guessing':
      if (action.type === 'guess') {
        const currentQuestion = state.questions[getCurrentQuestionIndex(state)];

        return {
          ...state,
          results: [...state.results, action.guess === currentQuestion.correct],
          state: 'result',
        };
      } else {
        return state;
      }
    case 'result':
      if (action.type === 'continue') {
        return hasMoreQuestions(state)
          ? {
              ...state,
              state: 'guessing',
            }
          : {
              ...state,
              state: 'finished',
            };
      } else {
        return state;
      }
    case 'finished':
      return action.type === 'restart'
        ? {
            state: 'guessing',
            questions: createQuestions(20),
            results: [],
          }
        : state;
  }
};

export const App = () => {
  const [state, dispatch] = useReducer(quizReducer, {
    state: 'guessing',
    questions: createQuestions(20),
    results: [],
  });

  const currentIndex = getCurrentQuestionIndex(state);
  const previousIndex = Math.max(0, getCurrentQuestionIndex(state) - 1);

  const displayIndex =
    state.state === 'guessing' ? currentIndex : previousIndex;
  const question = state.questions[displayIndex];

  // const guess = state.results[displayIndex]
  //   ? question.correct === 'a'
  //     ? 'a'
  //     : 'b'
  //   : question.correct === 'b'
  //   ? 'b'
  //   : 'a';

  const guess =
    question.correct === 'a'
      ? state.results[displayIndex]
        ? 'a'
        : 'b'
      : state.results[displayIndex]
      ? 'b'
      : 'a';

  const firstOptionRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (firstOptionRef.current && state.state === 'guessing') {
      firstOptionRef.current.focus();
    }
  }, [state.state]);

  const isFinished = !hasMoreQuestions(state);

  const score = state.results.filter((res) => res).length;

  const averageScore = state.results.length ? score / state.results.length : 0;

  return (
    <AppWrap>
      <h1>🈶 Landsmottogjettern 🗣</h1>

      <Scoreboard>
        {state.questions.map((q, idx) => (
          <span key={q.b + q.a}>
            {state.results[idx] === undefined
              ? '❓'
              : state.results[idx]
              ? '✅'
              : '❌'}
          </span>
        ))}
      </Scoreboard>
      <h2>Hvilket land tilhører dette mottoet?</h2>
      <q>{question.motto}</q>
      {state.state !== 'finished' && (
        <Options>
          <button
            autoFocus
            onClick={() => dispatch({ type: 'guess', guess: 'a' })}
            disabled={state.state === 'result'}
            data-is-correct={question.correct === 'a'}
            data-is-guess={guess === 'a'}
            ref={firstOptionRef}
          >
            {question.a}
          </button>
          <span>eller</span>
          <button
            onClick={() => dispatch({ type: 'guess', guess: 'b' })}
            disabled={state.state === 'result'}
            data-is-correct={question.correct === 'b'}
            data-is-guess={guess === 'b'}
          >
            {question.b}
          </button>
        </Options>
      )}
      {state.state === 'result' && (
        <Results>
          {state.results[previousIndex] ? (
            <p>🎉🎉🎉 Helt rett!!! 🏅🏅 </p>
          ) : (
            <p>Haha du tok feil 🤣🤣🙈💩</p>
          )}
          <button autoFocus onClick={() => dispatch({ type: 'continue' })}>
            {isFinished ? 'Ferdig 🤙' : 'Neste, takk 👉'}
          </button>
        </Results>
      )}
      {state.state === 'finished' && (
        <PostGame>
          {averageScore > 0.5 ? (
            <p>
              Wow, hele {score} rette! Dette var du god på. Vil du prøve igjen?
            </p>
          ) : (
            <p>
              Dette gikk ikke så bra. {score} poeng. Vil du gi det et nytt
              forsøk?
            </p>
          )}
          <PostGameOptions>
            <button autoFocus onClick={() => dispatch({ type: 'restart' })}>
              Ja!!!! 🔥🔥🔥
            </button>
            <button
              onClick={() => {
                const r1 = window.confirm('er du sikker?');
                if (r1) {
                  const r2 = window.confirm('*HELT* sikker???');
                  window.alert('flott, da starter vi på nytt');
                  dispatch({ type: 'restart' });
                } else {
                  dispatch({ type: 'restart' });
                }
              }}
            >
              Nei
            </button>
          </PostGameOptions>
        </PostGame>
      )}
    </AppWrap>
  );
};
