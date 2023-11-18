import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api'

function QuestionsList() {
  const { category } = useParams();
  const [questions, setQuestions] = useState([]);


  useEffect(() => {
    // Use the API function to fetch questions by category
    api.getQuestionsByCategory(category)
      .then((response) => {
        setQuestions(response.data);
      })
      .catch((error) => {
        console.error('Error fetching questions:', error);
      });
  }, [category]);


return (
  <div className="form-container">
    <h2 className="form-heading">{category} Questions</h2>
    <Link to={`/questions/${category}/new`} className="form-link">Create New Question</Link>
    <ul className='no-bullets'>
      {questions.map((question) => (
        <li key={question._id} className='no-bullets'>
          <Link to={`/threads/questions/${category}/${question._id}`} className="form-link">
            {question.title}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
}


export default QuestionsList;

