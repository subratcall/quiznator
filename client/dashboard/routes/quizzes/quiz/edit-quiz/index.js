import React from 'react';
import { connect } from 'react-redux';
import omit from 'lodash.omit';

import { 
  saveQuiz, fetchQuiz, updateQuiz, 
  updateData, 
  addDataItem, updateDataItem, removeDataItem,
  addDataChoice, updateDataChoice, removeDataChoice, 
  updateDataMeta, setDataMetaPath } from 'state/edit-quiz';
import { quizSelector, quizItemsSelector, quizChoicesSelector } from 'selectors/edit-quiz';

import Loader from 'components/loader';
import QuizEditor from 'components/quiz-editor';

class EditQuiz extends React.Component {
  componentDidMount() {
    this.props.loadQuiz();
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.params.id !== this.props.params.id) {
      this.props.loadQuiz();
    }
  }

  render() {
    if(this.props.loading) {
      return <Loader/>;
    } else {
      return <QuizEditor {...omit(this.props, ['loading', 'loadQuiz'])}/>;
    }
  }
}

const mapStateToProps = state => ({
  quiz: quizSelector(state),
  items: quizItemsSelector(state),
  choices: quizChoicesSelector(state),
  loading: !!state.editQuiz.meta.loading
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadQuiz: () => dispatch(fetchQuiz(ownProps.params.id)),
  onTitleChange: title => dispatch(updateQuiz({ title })),
  onBodyChange: body => dispatch(updateQuiz({ body })),
  onTagsChange: tags => dispatch(updateQuiz({ tags })),
  onPopulateAnswersChange: populateAnswers => dispatch(updateQuiz({ populateAnswers })),
  onDataItemChange: (itemId, update) => dispatch(updateDataItem(itemId, update)),
  onRemoveDataItem: itemId => dispatch(removeDataItem(itemId)),
  onDataChange: update => dispatch(updateData(update)),
  onAddDataItem: item => dispatch(addDataItem(item)),
  onDataItemOrderChange: order => dispatch(updateData({ items: order })),
  onDataMetaChange: update => dispatch(updateDataMeta(update)),
  onDataMetaPathChange: (path, value) => dispatch(setDataMetaPath(path, value)),
  //
  onDataChoiceChange: (choiceId, update) => dispatch(updateDataChoice(choiceId, update)),
  onRemoveDataChoice: choiceId => dispatch(removeDataChoice(choiceId)),
  onAddDataChoice: choice => dispatch(addDataChoice(choice)),
  onDataChoiceOrderChange: order => dispatch(updateData),
  //
  onSave: () => dispatch(saveQuiz())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditQuiz);
