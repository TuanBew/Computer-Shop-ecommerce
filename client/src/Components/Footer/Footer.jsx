import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

import logo from '../../assets/images/logo.png';

const cx = classNames.bind(styles);

function Footer() {
    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <div className={cx('info')}>
                    <img src={logo} alt="" />
                    <ul>
                        <li>COMPUTERSHOP là đại lý uỷ quyền chính thức của Apple tại Việt Nam (AAR)</li>
                        <li>Công ty cổ phần COMPUTERSHOP</li>
                        <li>Giấy phép ĐKKD số: 0123456789</li>
                        <li>Hotline tư vấn: 0869051659</li>
                        <li>Email: tuanbewclone2@gmail.com</li>
                        <li>Thời gian làm việc: 8h30 – 21h30</li>
                    </ul>
                </div>
                <div className={cx('support')}>
                    <h4>HỖ TRỢ KHÁCH HÀNG</h4>
                    <ul>
                        <li>Giới thiệu</li>
                        <li>Hướng dẫn mua hàng</li>
                        <li>Bán hàng Doanh Nghiệp</li>
                        <li>Mua trả góp</li>
                        <li>Tin công nghệ</li>
                        <li>COMPUTERfix – Trung tâm dịch vụ sửa chữa</li>
                        <li>Liên hệ</li>
                    </ul>
                </div>
                <div className={cx('policy')}>
                    <h4>CHÍNH SÁCH</h4>
                    <ul>
                        <li>Chính sách Bảo Hành & Đổi Trả</li>
                        <li>Chính sách đặt hàng</li>
                        <li>Chính sách vận chuyển</li>
                        <li>Chính sách bảo mật thông tin</li>
                        <li>Chính sách thanh toán</li>
                        <li>Gói bảo hành vàng COMPUTERSHOP Care</li>
                        <li>Các gói bảo hành hỗ trợ doanh nghiệp</li>
                    </ul>
                </div>
                <div className={cx('address')}>
                    <h4>Hồ Chí Minh:</h4>
                    <ul>
                        <li>Cơ sở 1: 19Đ Nguyễn Hữu Thọ, Q. 7, Hồ Chí Minh. SĐT: 0869051659</li>
                        <li>Cơ sở 1: 19Đ Nguyễn Hữu Thọ, Q. 7, Hồ Chí Minh. SĐT: 0869051659</li>
                        <li>Cơ sở 1: 19Đ Nguyễn Hữu Thọ, Q. 7, Hồ Chí Minh. SĐT: 0869051659</li>
                        <li>Cơ sở 1: 19Đ Nguyễn Hữu Thọ, Q. 7, Hồ Chí Minh. SĐT: 0869051659</li>
                        <li>(Các cơ sở đều có chỗ để tàu vũ trụ)</li>
                    </ul>
                </div>
            </div>

            <p className={cx('copyright')}>Copyright © 2025 - Bản quyền thuộc về Lê Nguyễn Tuấn Anh - Trần Quang Thái - Trần Thiện Ân .</p>
        </div>
    );
}

export default Footer;
