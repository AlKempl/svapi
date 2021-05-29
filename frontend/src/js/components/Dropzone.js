import React from "react";
import classnames from "classnames";
import {useDropzone} from "react-dropzone";

export const Dropzone = props => {
    const { onDrop, selectedFile } = props;
    const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop});

    const classNames = classnames({
        dropzone: true,
        "drag-active": isDragActive,
    });

    return (
        <div {...getRootProps()} className={classNames}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Отпустите, чтобы выбрать этот файл...</p> :
                    <p>
                        { selectedFile && <span>Файл выбран! </span> }
                        Перетащите фото в эту область или кликните для выбора { selectedFile && <span>нового</span> } файла
                    </p>
            }
        </div>
    )
};
