"use client";

type DeleteModalProps = {
    show: boolean;
    title?: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function DeleteModal({
    show,
    title = "ยืนยันการลบ",
    message = "คุณต้องการลบข้อมูลนี้หรือไม่?",
    onConfirm,
    onCancel,
}: DeleteModalProps) {

    if (!show) {
        return null;
    }

    return (
        <div
            className="modal"
            style={{
                display: "flex",
            }}
            onClick={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onCancel();
                }

            }}
        >

            <div className="delete-modal">

                <div className="delete-icon">
                    ⚠️
                </div>

                <h3>
                    {title}
                </h3>

                <p>
                    {message}
                </p>

                <div className="delete-actions">

                    <button
                        className="btn-cancel"
                        onClick={onCancel}
                    >
                        ยกเลิก
                    </button>

                    <button
                        className="btn-delete-confirm"
                        onClick={onConfirm}
                    >
                        ลบข้อมูล
                    </button>

                </div>

            </div>

        </div>
    );
}