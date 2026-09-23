package com.vericure.vericurebackend.repository;

import com.vericure.vericurebackend.entity.MedicineReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineReportRepository extends JpaRepository<MedicineReport, Long> {

    List<MedicineReport> findAllByOrderByCreatedAtDesc();

    List<MedicineReport> findByStatusOrderByCreatedAtDesc(String status);
}
