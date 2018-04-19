import React from 'react'
import { Button, FormGroup, Label, Input } from 'reactstrap'
import Select from 'react-select'
import get from 'lodash/get'

import ItemEditor from 'components/quiz-editor/item-editor'
import MetaEditor from 'components/quiz-editor/meta-editor'

class RadioMatrixQuizEditor extends React.Component {
    onDataChoiceChange(id, value) {
        this.props.onDataChoiceChange(id, { title: value })
    }

    onAddDataChoice() {
        this.props.onAddDataChoice({ title: '' })
    }

    onRemoveDataChoice(id) {
        this.props.onRemoveDataChoice(id)
    }

    onDataItemChange(id, value) {
        this.props.onDataItemChange(id, { title: value });
    }

    onAddDataItem() {
        this.props.onAddDataItem({ title: '' });
    }

    onRemoveDataItem(id) {
        this.props.onRemoveDataItem(id);
    }
    
    render() {
        return (
            <div>
                <FormGroup>
                    <Label>Choices</Label>
                    {//separate component...
                    }
                    <ItemEditor
                        items={this.props.choices}
                        type={this.props.quiz.type}
                        onAddDataItem={this.onAddDataChoice.bind(this)}
                        onDataItemOrderChange={this.props.onDataChoiceOrderChange}
                        onDataItemChange={this.onDataChoiceChange.bind(this)} 
                        onRemoveDataItem={this.onRemoveDataChoice.bind(this)}
                    />

                </FormGroup>

                <div className="m-b-1">
                    <label>Items</label>
        
                    <ItemEditor items={this.props.items} onAddDataItem={this.onAddDataItem.bind(this)} onDataItemOrderChange={this.props.onDataItemOrderChange} onDataItemChange={this.onDataItemChange.bind(this)} onRemoveDataItem={this.onRemoveDataItem.bind(this)}/>
                </div>
            
            </div>
        )
    }
}

RadioMatrixQuizEditor.defaultProps = {
    items: [],
    choices: []
}

export default RadioMatrixQuizEditor;
